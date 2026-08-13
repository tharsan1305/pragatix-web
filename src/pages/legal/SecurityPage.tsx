import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <Link to="/login" className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Security</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">Trust &amp; Safety</span>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Security</h1>
        <div className="text-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <span><strong>Version:</strong> 1.3</span>
          <span className="ml-4"><strong>Effective Date:</strong> August 11, 2026</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-sm mb-6"><strong>Operated by:</strong> J.J. College of Engineering and Technology (JJCET)</p>
        <p className="text-slate-600 leading-relaxed text-sm mb-6">We take the protection of student and staff data seriously and maintain an active security program for the PragatiX platform.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">1. Our Security Measures</h2>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>Data is hosted on AWS infrastructure (Mumbai region) with encryption in transit (TLS).</li>
          <li>Where supported by the platform, data is also protected with encryption at rest.</li>
          <li>Access to records is enforced through Role-Based Access Control (RBAC). Users can only view data relevant to their assigned role.</li>
          <li>The platform is protected by AWS Web Application Firewall (WAF) with active logging and monitoring.</li>
          <li>We enforce modern browser security headers, including Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy, to help protect against common web attacks such as cross-site scripting and clickjacking.</li>
          <li>Authentication is performed using OTP verification followed by secure token-based session management. The maximum session duration is 16 hours.</li>
          <li>Access to production systems is restricted to authorised personnel only.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">2. Responsible Disclosure</h2>
        <p className="text-slate-600 leading-relaxed text-sm">If you discover a potential security vulnerability in PragatiX, please report it to us privately before any public disclosure so that we can investigate and address it responsibly.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-4">
          <p className="text-slate-600 text-sm mb-1"><strong>Email:</strong> <a href="mailto:jagadeesanrv@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jagadeesanrv@jjcet.ac.in</a></p>
        </div>
        <p className="text-slate-600 leading-relaxed text-sm mt-4">We aim to acknowledge valid reports within 72 hours.</p>
        <p className="text-slate-600 leading-relaxed text-sm">When submitting a report, please include:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>A clear description of the issue</li>
          <li>Steps to reproduce the vulnerability</li>
          <li>Any relevant screenshots, logs, or proof-of-concept (if available)</li>
        </ul>
        <p className="text-slate-600 leading-relaxed text-sm">Please do not access, modify, or delete data belonging to other users while testing. Do not perform any activity that could harm the availability or integrity of the system.</p>
        <p className="text-slate-600 leading-relaxed text-sm">We appreciate the efforts of security researchers and the community in helping us keep PragatiX safe.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">3. Updates</h2>
        <p className="text-slate-600 leading-relaxed text-sm">This Security statement may be updated from time to time. The latest version will always be available on the PragatiX platform.</p>

        <p className="mt-6 text-sm text-slate-500 italic">Approved by: Principal's Office, JJCET</p>
      </main>

      <footer className="py-6 text-center text-xs font-semibold text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
