/**
 * Single-File Client Authentication & JWKS Demo Server
 *
 * Hosted at:
 * https://cookie-demo-be.securedapp.io
 *
 * Endpoints:
 * GET  /.well-known/jwks.json
 * POST /api/login
 * GET  /health
 */

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.CLIENT_PORT || 4099;

// Public HTTPS URL of this server
const BASE_URL =
    process.env.BASE_URL || 'https://cookie-demo-be.securedapp.io';

const KEY_ID = 'demo-client-key-1';
const ISSUER = BASE_URL;

// Generate RSA key pair
console.log('Generating RSA 2048-bit Key Pair for Demo IdP...');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// Convert public key to JWK
const exportedJwk = crypto
    .createPublicKey(publicKey)
    .export({ format: 'jwk' });

const publicJwk = {
    ...exportedJwk,
    kid: KEY_ID,
    use: 'sig',
    alg: 'RS256'
};

console.log(`JWKS initialized with key ID: ${KEY_ID}`);
console.log(`Issuer: ${ISSUER}`);

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function base64UrlEncode(value) {
    return Buffer.from(value)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function createSignedJwt(
    payload,
    audience = 'hdfc',
    tenantId = 'ICICI Bank',
    appId = 'hdfc'
) {
    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: KEY_ID
    };

    const now = Math.floor(Date.now() / 1000);

    const fullPayload = {
        iss: ISSUER,
        aud: audience,
        sub: payload.userId,

        tenant_id: tenantId,
        app_id: appId,

        name: payload.name || payload.userId,

        iat: now,
        nbf: now,
        exp: now + 3600
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));

    const signatureInput = `${headerB64}.${payloadB64}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    signer.end();

    const signature = signer.sign(privateKey);

    const signatureB64 = signature
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${signatureInput}.${signatureB64}`;
}

// --------------------------------------------------
// HTTP Server
// --------------------------------------------------

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(
        req.url,
        BASE_URL
    );

    // ------------------------------------------------
    // 1. JWKS Endpoint
    // ------------------------------------------------

    if (
        req.method === 'GET' &&
        url.pathname === '/.well-known/jwks.json'
    ) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(
            JSON.stringify(
                {
                    keys: [publicJwk]
                },
                null,
                2
            )
        );

        return;
    }

    // ------------------------------------------------
    // 2. Login / JWT Issuance
    // ------------------------------------------------

    if (
        req.method === 'POST' &&
        url.pathname === '/api/login'
    ) {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');

                const userId =
                    data.userId || 'user_123';

                const tenantId =
                    data.tenantId || 'ICICI Bank';

                const appId =
                    data.appId || 'hdfc';

                const audience =
                    data.audience || appId;

                const token = createSignedJwt(
                    {
                        userId,
                        name: data.name
                    },
                    audience,
                    tenantId,
                    appId
                );

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                res.end(
                    JSON.stringify(
                        {
                            success: true,

                            userId,
                            tenantId,
                            appId,

                            token,

                            issuer: ISSUER,

                            jwks_url:
                                `${ISSUER}/.well-known/jwks.json`,

                            expires_in: 3600
                        },
                        null,
                        2
                    )
                );
            } catch (err) {
                res.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                res.end(
                    JSON.stringify({
                        error: err.message
                    })
                );
            }
        });

        return;
    }

    // ------------------------------------------------
    // 3. Health Check
    // ------------------------------------------------

    if (
        url.pathname === '/' ||
        url.pathname === '/health'
    ) {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(
            JSON.stringify(
                {
                    status: 'online',

                    service:
                        'Demo Client Identity Provider (JWKS & Auth)',

                    issuer: ISSUER,

                    jwks_url:
                        `${ISSUER}/.well-known/jwks.json`,

                    endpoints: {
                        jwks:
                            'GET /.well-known/jwks.json',

                        login:
                            'POST /api/login'
                    }
                },
                null,
                2
            )
        );

        return;
    }

    // ------------------------------------------------
    // 404
    // ------------------------------------------------

    res.writeHead(404, {
        'Content-Type': 'application/json'
    });

    res.end(
        JSON.stringify({
            error: 'Endpoint not found'
        })
    );
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------

server.listen(PORT, () => {
    console.log(`
======================================================
🔑 Demo Client IdP & JWKS Server running!

🌐 Base URL:
   ${BASE_URL}

📜 JWKS:
   ${BASE_URL}/.well-known/jwks.json

🔐 Login:
   POST ${BASE_URL}/api/login

❤️ Health:
   ${BASE_URL}/health

🆔 Issuer:
   ${ISSUER}

🔑 Key ID:
   ${KEY_ID}
======================================================
`);
});