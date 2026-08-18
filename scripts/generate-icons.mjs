import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const regular = readFileSync('./public/favicon.svg')
const maskable = readFileSync('./public/icon-maskable.svg')

const jobs = [
  { buf: regular, size: 192, out: './public/icon-192.png' },
  { buf: regular, size: 512, out: './public/icon-512.png' },
  { buf: maskable, size: 192, out: './public/icon-maskable-192.png' },
  { buf: maskable, size: 512, out: './public/icon-maskable-512.png' },
]

for (const job of jobs) {
  await sharp(job.buf, { density: 384 }).resize(job.size, job.size).png().toFile(job.out)
  console.log('généré', job.out)
}
