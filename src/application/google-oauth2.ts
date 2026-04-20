import { google } from "googleapis";
import { config } from "../config/env";

// for documentastion you can see in: https://developers.google.com/identity/protocols/oauth2/web-server

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI
 * from the client_secret.json file. To get these credentials for your application, visit
 * https://console.cloud.google.com/apis/credentials.
 */
export const oauth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  `${config.APP_URL}${config.GOOGLE_REDIRECT_URL}`
)

// Access scopes for two non-Sign-In scopes: Read-only Drive activity and Google Calendar.
export const scopes = [
  'openid', // ID Token + sub
  'https://www.googleapis.com/auth/userinfo.email', // email user
  'https://www.googleapis.com/auth/userinfo.profile' // nama + foto
]