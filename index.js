const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000
const jwt = require('jsonwebtoken')

app.use(express.json())

const users = [
  {
    id: 1,
    name: 'John',
    password: 'john123',
    isAdmin: true,
  },
  {
    id: 2,
    name: 'Jane',
    password: 'jane123',
    isAdmin: false,
  },
]

const generateAcessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      isAdmin: user.isAdmin,
    },
    'accessSecret',
    { expiresIn: '1h' }
  )
}
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      isAdmin: user.isAdmin,
    },
    'refreshSecret'
  )
}

app.post('/api/login', (req, res) => {
  const { name, password } = req.body
  const user = users.find((u) => {
    return u.name === name && u.password === password
  })
  if (user) {
    //generate and access token
    const accessToken = generateAcessToken(user)
    const refreshToken = generateRefreshToken(user)
    refreshTokens.push(refreshToken)

    res.json({
      name: user.name,
      isAdmin: user.isAdmin,
      accessToken: accessToken,
      refreshToken: refreshToken,
    })
  } else {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    jwt.verify(token, 'accessSecret', (err, user) => {
      if (err) {
        res.status(401).json({ error: 'Invalid token' })
      }
      req.user = user
      if(parseInt(req.params.id)===parseInt(user.id))
      {
      next()
      }
      else if(user.isAdmin)
      {
        next()
      }

      else
      {
        res.status(401).json({ error: 'Not Authorized! ' })
      }
     
    })
  } else {
    res.status(401).json({ error: 'No token provided' })
  }
}

let refreshTokens = []

app.post('/api/refresh', (req, res) => {
  //take the refresh token from user
  const refreshToken = req.body.token

  //send error if there is no token or invalid token
  if (!refreshToken) {
    res.status(401).json({ error: 'No token provided' })
  }
  if (!refreshTokens.includes(refreshToken)) {
    res.status(401).json({ error: 'Invalid token' })
  }
  jwt.verify(refreshToken, 'refreshSecret', (err, user) => {
    err && res.status(401).json({ error: 'Invalid token' })
    refreshTokens = refreshTokens.filter((token) => {
      return token !== refreshToken
    })
    const newAccessToken = generateAcessToken(user)
    const newRefreshToken = generateRefreshToken(user)

    refreshTokens.push(newRefreshToken)
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  })

  //if everything ok create new access token, refresh token and send to user
})

app.delete('/api/users/:id', verify, (req, res) => {
  
  if (parseInt(req.user.id) === parseInt(req.params.id) || req.user.isAdmin) {
    res.status(200).json({ message: 'User deleted' })
  } else {
    res.status(401).json("You don't have permission to delete this user")
  }
})

app.post('/api/logout', verify, (req, res) => {
  const refreshToken = req.body.token
  refreshTokens = refreshTokens.filter((token) => {
    return token !== refreshToken
  })
  res.status(200).json({ message: 'Logged out' })
})

app.get('/', (req, res) => {
  res.send({
    login: '/api/login',
    logout: '/api/logout',
    refresh: '/api/refresh',
    deleteuser: '/api/users/:id',
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})
