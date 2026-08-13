import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <Link to="/login" className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Cookie &amp; Tracking Policy</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">Legal &amp; Compliance</span>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Cookie &amp; Tracking Policy</h1>
        <div className="text-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <span><strong>Effective Date:</strong> August 11, 2026</span>
          <span className="ml-4"><strong>Last Updated:</strong> August 11, 2026</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-sm mb-6">This Cookie Policy explains how PragatiX ("we", "us", or "our") handles cookies and client-side storage mechanisms on our platform and applications (the "Platform").</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">1. What Are Cookies?</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Cookies are small text files placed on your computer or mobile device when you visit a website. They are typically used to store state, track user browsing sessions, deliver advertisements, and gather analytics data across websites.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">2. PragatiX Does Not Use Cookies</h2>
        <p className="text-slate-600 leading-relaxed text-sm">PragatiX does not set, deploy, or use cookies of any kind. Our platform is engineered on a stateless, token-based architecture. We do not write tracking data or session identifiers to your browser's cookie storage.</p>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li><strong>No First-Party Cookies:</strong> We do not set any cookies for site features, authentication, or tracking.</li>
          <li><strong>No Third-Party Cookies:</strong> We do not allow third-party services to drop cookies on your device.</li>
          <li><strong>No Marketing or Advertising Pixels:</strong> We do not use behavioral targeting, retargeting scripts, or advertising networks.</li>
          <li><strong>No Third-Party Analytics Trackers:</strong> We do not track your activity across other websites or sell/share your data.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">3. How Authentication &amp; Client-Side Storage Work</h2>
        <p className="text-slate-600 leading-relaxed text-sm">To allow you to securely log in and access your account, PragatiX uses stateless authentication via JSON Web Tokens (JWT):</p>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li><strong>Token Issuance:</strong> After completing secure OTP verification, your client receives an access token and a refresh token.</li>
          <li><strong>Token Storage:</strong> The short-lived access token is kept only in application memory (not written to disk or persistent storage). The refresh token is stored in the device's secure client-side storage (platform-secure storage such as Android Keystore / encrypted storage on mobile, or appropriate secure browser storage on the web).</li>
          <li><strong>Purpose:</strong> These tokens are used solely to authenticate API requests and maintain your session. They cannot be accessed by other websites due to browser same-origin protections and platform security features.</li>
          <li><strong>Validity Period:</strong> The overall session is valid for a maximum duration of 16 hours.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">4. Managing Your Session &amp; Data</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Because we do not use cookies, managing your session is simple:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li><strong>Logging Out:</strong> Clicking the "Logout" button immediately deletes both the access token (from memory) and the refresh token (from secure storage) on your device.</li>
          <li><strong>Manual Clearing:</strong> You can end your active session at any time by clearing your browser's or application's local storage and cache.</li>
          <li><strong>Automatic Expiration:</strong> After 16 hours from login, the session automatically expires, requiring a new OTP verification to continue using the platform.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">5. Changes to This Cookie Policy</h2>
        <p className="text-slate-600 leading-relaxed text-sm">We may revise this policy from time to time to reflect operational or legal updates. Any changes will be posted directly to this page with an updated "Last Updated" date.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">6. Contact Us</h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-slate-600 text-sm mb-1"><strong>Institution:</strong> J.J. College of Engineering and Technology</p>
          <p className="text-slate-600 text-sm"><strong>Email:</strong> <a href="mailto:principal@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">principal@jjcet.ac.in</a></p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs font-semibold text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
