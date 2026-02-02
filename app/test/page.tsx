import { users } from '@/database/schema'
import { db } from '@/lib/db'

export default async function TestPage() {
  // Simple GET query on the User table
  const allUsers = await db.select().from(users)

  return (
    <div>
      <h1>TestPage – Users</h1>
      {allUsers.map(u => <div key={u.id}>{u.fullName}</div>)}
      {/* <pre>{JSON.stringify(allUsers.map(u => u.fullName), null, 2)}</pre> */}
      <form action=""></form>
    </div>
  )
}
