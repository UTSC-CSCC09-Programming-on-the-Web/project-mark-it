import { sequelize } from './datasource.js'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import session from 'express-session'
import { SESSION_SECRET } from './secrets.js'
import passport from 'passport'
import { readFileSync } from 'fs'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { oauthRouter } from './routers/oauth_router.js'
import { usersRouter } from './routers/users_router.js'
import { filesRouter } from './routers/files_router.js'
import { User } from './models/user.js'

const PORT = 3001
const app = express()
app.use(bodyParser.json())

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
)

try {
  await sequelize.authenticate()
  await sequelize.sync({ alter: { drop: false } })
  console.log('Connection has been established successfully.')
} catch (error) {
  console.error('Unable to connect to the database:', error)
}

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function (user, done) {
  done(null, JSON.stringify(user))
})

passport.deserializeUser(function (user, done) {
  done(null, JSON.parse(user))
})

const GoogleCredentials = JSON.parse(readFileSync('google.json.nogit', 'utf8'))

passport.use(
  new GoogleStrategy(GoogleCredentials, async function (accessToken, refreshToken, profile, done) {
    try {
      let user = await User.findOne({ where: { googleId: profile.id } })
      if (!user) {
        user = await User.create({ googleId: profile.id, displayName: profile.displayName })
      }
      return done(null, user)
    } catch (error) {
      return done(error, null)
    }
  }),
)

app.use('/auth/', oauthRouter)
app.use('/api/users/', usersRouter)
app.use('/api/files/', filesRouter)

app.listen(PORT, (err) => {
  if (err) console.log(err)
  else console.log('HTTP server on http://localhost:%s', PORT)
})
