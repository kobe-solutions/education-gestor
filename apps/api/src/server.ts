import 'dotenv/config'
import { buildApp } from './app'
import { env } from './env'

const app = buildApp()

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
