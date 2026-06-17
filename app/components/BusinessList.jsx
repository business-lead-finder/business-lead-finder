import BusinessCard from './BusinessCard'

export default function BusinessList({ businesses, userId }) {
  if (!businesses.length) return null

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {businesses.map((b) => (
        <BusinessCard key={b.place_id} business={b} userId={userId} />
      ))}
    </div>
  )
}
