// ========================== INITIALIZE OAUTH2 ==========================
export type OAuth2Request = {
    redirectPath: string
}

export type OAuth2Response = {
    authUrl: string
}

// ========================== CALLBACK ==========================
export type OAuth2CallbackRequest = {
    code: string
    state: string
}