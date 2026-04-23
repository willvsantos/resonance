import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding system voices...')

  const systemVoices = [
    { name: 'Adam', description: 'Deep, resonant male voice', category: 'Narrative', locale: 'en-US', isSystem: true },
    { name: 'Bella', description: 'Soft, clear female voice', category: 'Soft', locale: 'en-US', isSystem: true },
    { name: 'Charlie', description: 'Energetic young male', category: 'Conversational', locale: 'en-US', isSystem: true },
    { name: 'Dorothy', description: 'Warm, mature female', category: 'Narrative', locale: 'en-US', isSystem: true },
    { name: 'Ethan', description: 'Professional narrator', category: 'Narrative', locale: 'en-US', isSystem: true },
    { name: 'Freya', description: 'British accent, friendly', category: 'Conversational', locale: 'en-GB', isSystem: true },
    { name: 'George', description: 'Authoritative and calm', category: 'News', locale: 'en-US', isSystem: true },
    { name: 'Hannah', description: 'Bubbly and bright', category: 'Conversational', locale: 'en-US', isSystem: true },
    { name: 'Ian', description: 'Australian accent, laid back', category: 'Conversational', locale: 'en-AU', isSystem: true },
    { name: 'Jasmine', description: 'Serene and melodic', category: 'Soft', locale: 'en-US', isSystem: true },
    { name: 'Kevin', description: 'Conversational and relatable', category: 'Conversational', locale: 'en-US', isSystem: true },
    { name: 'Lily', description: 'Child-like, high pitch', category: 'Character', locale: 'en-US', isSystem: true },
    { name: 'Marcus', description: 'Gravely, dramatic male', category: 'Character', locale: 'en-US', isSystem: true },
    { name: 'Nicole', description: 'Sophisticated and precise', category: 'Narrative', locale: 'en-US', isSystem: true },
    { name: 'Oliver', description: 'Posh British accent', category: 'Conversational', locale: 'en-GB', isSystem: true },
    { name: 'Penelope', description: 'Vintage, radio-style female', category: 'News', locale: 'en-US', isSystem: true },
    { name: 'Quinn', description: 'Androgynous, neutral tone', category: 'Narrative', locale: 'en-US', isSystem: true },
    { name: 'Rachel', description: 'Fast-paced, excited', category: 'Conversational', locale: 'en-US', isSystem: true },
    { name: 'Sam', description: 'Standard American male', category: 'Narrative', locale: 'en-US', isSystem: true },
    { name: 'Tara', description: 'Whispery and intimate', category: 'Soft', locale: 'en-US', isSystem: true },
  ]

  for (const voice of systemVoices) {
    const id = `system-${voice.name.toLowerCase()}`;
    const previewUrl = null; 
    
    await prisma.voice.upsert({
      where: { id },
      update: {},
      create: {
        id,
        previewUrl,
        ...voice,
      },
    })
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
