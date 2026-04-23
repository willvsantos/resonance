import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(SIGNING_SECRET)

  let evt: WebhookEvent

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification failed', {
      status: 400,
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { email_addresses } = evt.data
    const email = email_addresses[0]?.email_address

    if (!id || !email) {
      return new Response('Error: Missing user data', { status: 400 })
    }

    await db.user.create({
      data: {
        clerkId: id,
        email: email,
      },
    })
  }

  if (eventType === 'user.updated') {
    const { email_addresses } = evt.data
    const email = email_addresses[0]?.email_address

    if (!id || !email) {
      return new Response('Error: Missing user data', { status: 400 })
    }

    await db.user.update({
      where: { clerkId: id },
      data: { email: email },
    })
  }

  if (eventType === 'user.deleted') {
    if (!id) {
      return new Response('Error: Missing user ID', { status: 400 })
    }

    await db.user.delete({
      where: { clerkId: id },
    })
  }

  return new Response('Webhook received', { status: 200 })
}
