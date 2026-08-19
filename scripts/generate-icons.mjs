import sharp from 'sharp'

const SOURCE = './public/icon-source.png'
const BG = '#05081f'
const TRIM_MARGIN = 0.075 // retire le liseré parasite (rouge/jaune) autour de l'illustration source

async function croppedSource() {
  const { width, height } = await sharp(SOURCE).metadata()
  const margin = Math.round(width * TRIM_MARGIN)
  return sharp(SOURCE)
    .extract({ left: margin, top: margin, width: width - margin * 2, height: height - margin * 2 })
    .toBuffer()
}

const source = await croppedSource()

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
