// Where the contact form posts. The default is the Express API in /server (see .env.example).
// You can also point this at a Formspree URL (https://formspree.io/f/xxxx) and skip the server.
// If the request can't be reached (e.g. static hosting without the API), the form falls back to a mailto link.
export const CONTACT_ENDPOINT = '/api/contact'

// Put your PDF in the /public folder as resume.pdf (or change this path).
export const RESUME_URL = '/resume.pdf'

export const EMAIL = 'ayushgokhle@gmail.com'
export const LINKEDIN = 'https://www.linkedin.com/in/ayush-gokhle-343521224'
