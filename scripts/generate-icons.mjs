import sharp from 'sharp'

const SOURCE = './public/icon-source.png'
const BG = '#05081f'

const source = SOURCE

const jobs = [
  { size: 192, out: './public/icon-192.png' },
  { size: 512, out: './public/icon-512.png' },
]

for (const job of jobs) {
  await sharp(source).resize(job.size, job.size).png().toFile(job.out)
  console.log('généré', job.out)
}

const maskableJobs = [
  { size: 192, out: './public/icon-maskable-192.png' },
  { size: 512, out: './public/icon-maskable-512.png' },
]

for (const job of maskableJobs) {
  const inner = Math.round(job.size * 0.78)
  const artwork = await sharp(source).resize(inner, inner).toBuffer()
  await sharp({
    create: {
      width: job.size,
      height: job.size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: artwork, gravity: 'center' }])
    .png()
    .toFile(job.out)
  console.log('généré', job.out)
}
