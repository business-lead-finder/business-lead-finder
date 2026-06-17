import * as cheerio from 'cheerio'
import { supabase } from '../../../lib/supabase'

// Local-part prefixes that mark an address as a generic role account, not a person
const GENERIC_PREFIXES = [
  'info', 'contact', 'support', 'sales', 'admin', 'help', 'office', 'team',
  'hello', 'hi', 'enquiries', 'inquiries', 'service', 'services', 'noreply',
  'no-reply', 'donotreply', 'webmaster', 'marketing', 'careers', 'jobs',
  'press', 'media', 'billing', 'accounts', 'orders', 'booking', 'bookings',
  'reservations', 'general', 'mail', 'email', 'newsletter', 'feedback',
]

// Pages worth checking on a small business site, beyond the homepage
const PATHS_TO_CRAWL = [
  '', '/about', '/about-us', '/team', '/our-team', '/staff', '/leadership',
  '/management', '/contact', '/contact-us', '/people', '/meet-the-team',
]

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const NAME_REGEX = /\b[A-Z][a-z]+(?:\s[A-Z]\.)?\s[A-Z][a-z]+\b/

function isPersonalEmail(email) {
  const localPart = email.split('@')[0].toLowerCase()
  return !GENERIC_PREFIXES.some(
    (prefix) =>
      localPart === prefix ||
      localPart.startsWith(`${prefix}.`) ||
      localPart.startsWith(`${prefix}-`) ||
      localPart.startsWith(`${prefix}_`)
  )
}

// Rough heuristic: "jane.smith@" or "j.smith@" look like real people,
// "jsmith@" or "jane@" are plausible but less certain, anything else is a guess.
function scoreConfidence(email) {
  const localPart = email.split('@')[0].toLowerCase()
  if (/^[a-z]+\.[a-z]+$/.test(localPart)) return 'high'
  if (/^[a-z]\.[a-z]+$/.test(localPart)) return 'high'
  if (/^[a-z]+$/.test(localPart) && localPart.length <= 12) return 'medium'
  return 'low'
}

// Look at the surrounding block of text for something that reads like "First Last"
function findNearbyName($, el) {
  const context = $(el)
    .closest('div, li, tr, section, article, p')
    .text()
    .replace(/\s+/g, ' ')
    .trim()
  const match = context.match(NAME_REGEX)
  return match ? match[0] : null
}

export async function POST(request) {
  try {
    const { businessId, website } = await request.json()

    if (!website) {
      return Response.json({ error: 'This business has no website on file' }, { status: 400 })
    }

    let baseUrl
    try {
      baseUrl = new URL(website).origin
    } catch {
      return Response.json({ error: 'Website URL is not valid' }, { status: 400 })
    }

    const found = new Map() // email -> { name, source_url }
    let pagesChecked = 0

    for (const path of PATHS_TO_CRAWL) {
      const url = baseUrl + path
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadFinderBot/1.0)' },
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) continue
        pagesChecked++

        const html = await res.text()
        const $ = cheerio.load(html)

        // mailto: links are the most reliable signal, and often sit next to a name
        $('a[href^="mailto:"]').each((_, el) => {
          const href = $(el).attr('href') || ''
          const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase()
          if (email && !found.has(email)) {
            found.set(email, { name: findNearbyName($, el), source_url: url })
          }
        })

        // Fallback: any email-shaped string in the visible page text
        const bodyText = $('body').text()
        const textEmails = bodyText.match(EMAIL_REGEX) || []
        for (const raw of textEmails) {
          const email = raw.toLowerCase()
          if (!found.has(email)) {
            found.set(email, { name: null, source_url: url })
          }
        }
      } catch {
        continue // page missing, blocked, or timed out — move on to the next one
      }
    }

    const contacts = []
    for (const [email, info] of found) {
      if (!isPersonalEmail(email)) continue
      contacts.push({
        business_id: businessId,
        name: info.name,
        email,
        source_url: info.source_url,
        confidence: scoreConfidence(email),
      })
    }

    const rank = { high: 3, medium: 2, low: 1 }
    contacts.sort((a, b) => rank[b.confidence] - rank[a.confidence])

    if (contacts.length > 0 && businessId) {
      const { error } = await supabase.from('contacts').insert(contacts)
      if (error) console.error('Supabase insert error:', error)
    }

    return Response.json({ contacts, pagesChecked })
  } catch (err) {
    console.error('find-contact error:', err)
    return Response.json({ error: 'Something went wrong during the crawl' }, { status: 500 })
  }
}
