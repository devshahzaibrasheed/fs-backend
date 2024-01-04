const axios = require('axios');
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client()

class GoogleStrategy {
  async validate(accessToken) {
    let result = null
    await axios
      .get(process.env.GOOGLE_VERIFY_API, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        console.log("Response Data",response.data)
        const { name, email, id, picture, given_name, family_name } = response.data

        const payload = {
          name,
          email,
          picture,
          given_name,
          family_name
        }

        result = { payload, userid: id }
      })
      .catch((error) => {
        console.error('Error fetching user data:', error)
      })
    console.log('result', result)
    return result
  }
}

module.exports = { googleStrategy: new GoogleStrategy() };
