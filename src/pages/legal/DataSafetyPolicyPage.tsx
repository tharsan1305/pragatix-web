import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DataSafetyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <Link to="/login" className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Data Safety Policy</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">App Store &amp; Compliance</span>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Data Safety Policy</h1>
        <div className="text-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <span><strong>Version:</strong> 1.1</span>
          <span className="ml-4"><strong>Effective Date:</strong> August 11, 2026</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-sm mb-6"><strong>Prepared for:</strong> Google Play Console "Data Safety" section and Apple App Store "App Privacy" disclosure</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">1. Does This App Collect or Share User Data?</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Yes. PragatiX collects personal data that is necessary to provide academic administration, attendance tracking, discipline management, and notification services for JJCET students, teachers, and staff.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">2. Data Types Collected</h2>
        <h3 className="text-base font-bold text-slate-800 mt-4 mb-2 uppercase tracking-wide">Personal Info</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>Name - Collected - Required - App functionality</li>
          <li>Email address - Collected - Required - App functionality, communications</li>
          <li>Phone number - Collected - Required - App functionality, OTP, and notifications</li>
          <li>User IDs (roll number / register number) - Collected - Required - App functionality</li>
          <li>Address - Collected - Required - Academic records</li>
        </ul>

        <h3 className="text-base font-bold text-slate-800 mt-4 mb-2 uppercase tracking-wide">Other Categories</h3>
        <p className="text-slate-500 italic text-sm my-2">Financial Info - Not collected</p>
        <p className="text-slate-500 italic text-sm my-2">Health and Fitness - Not collected</p>
        <p className="text-slate-500 italic text-sm my-2">Messages - Not collected (no in-app chat or messaging between users)</p>
        <p className="text-slate-500 italic text-sm my-2">Photos and Videos - Not collected</p>
        <p className="text-slate-500 italic text-sm my-2">Audio Files - Not collected</p>
        <p className="text-slate-500 italic text-sm my-2">Files and Docs - Not collected</p>
        <p className="text-slate-500 italic text-sm my-2">Calendar - Not collected</p>
        <p className="text-slate-500 italic text-sm my-2">Contacts - Not collected</p>
        <p className="text-slate-500 italic text-sm my-2">Web Browsing - Not collected</p>
        <p className="text-slate-500 italic text-sm my-2">Location - Not collected</p>

        <h3 className="text-base font-bold text-slate-800 mt-4 mb-2 uppercase tracking-wide">App Activity</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>App interactions - Collected - Required - App functionality (attendance, marks, discipline logs)</li>
          <li>Other actions - Collected - Required - App functionality</li>
        </ul>

        <h3 className="text-base font-bold text-slate-800 mt-4 mb-2 uppercase tracking-wide">App Info and Performance</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>Crash logs - Collected - Optional - Analytics / stability</li>
          <li>Diagnostics - Collected - Optional - Analytics / stability</li>
        </ul>

        <h3 className="text-base font-bold text-slate-800 mt-4 mb-2 uppercase tracking-wide">Device or Other IDs</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>Device or other IDs - Collected - Required - App functionality and security</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">3. Is Data Shared With Third Parties?</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Yes, but only with service providers who process data on our behalf strictly for technical operations:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>Amazon Web Services (India) - hosting and database infrastructure</li>
          <li>ZeptoMail - transactional email delivery</li>
          <li>Airtel IQ - SMS delivery</li>
        </ul>
        <p className="text-slate-600 leading-relaxed text-sm">We do <strong>not</strong> share data with advertisers, data brokers, analytics companies for marketing, or any third party for advertising or tracking purposes. We do <strong>not</strong> sell user data.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">4. Is Data Encrypted in Transit?</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Yes. All data transmitted between the app and our servers is encrypted using industry-standard TLS.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">5. Can Users Request Data Deletion?</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Yes. Users may request deletion of their account and personal data by emailing principal@jjcet.ac.in - see our <Link to="/data-deletion" className="text-indigo-600 hover:text-indigo-800 underline">Account &amp; Data Deletion Policy</Link> for the full process. Requests are handled in accordance with the Digital Personal Data Protection Act, 2023, and are subject to applicable academic and legal retention requirements.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">6. Security Practices</h2>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>Data encrypted in transit (TLS)</li>
          <li>Role-Based Access Control (RBAC) limiting data visibility by role</li>
          <li>OTP-based authentication</li>
          <li>Secure token-based session management (maximum session duration: 16 hours)</li>
          <li>Platform-level security controls on hosting infrastructure</li>
          <li>Appropriate technical and organisational measures to protect personal data</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">7. Children's Data</h2>
        <p className="text-slate-600 leading-relaxed text-sm">PragatiX is used by students of JJCET, some of whom may be under 18 years of age, within an educational institution context.</p>
        <p className="text-slate-600 leading-relaxed text-sm">Data is processed for legitimate educational and administrative purposes of the college. Parent/guardian mobile numbers are stored solely for the purpose of sending attendance-related SMS notifications.</p>
        <p className="text-slate-600 leading-relaxed text-sm">PragatiX does not target children with advertising and does not use children's data for any purpose beyond academic administration and necessary communication.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">8. Data Retention Summary</h2>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>Academic and discipline records: Retained for the duration of enrollment and thereafter as required for academic history, transcripts, and verification.</li>
          <li>Session and activity logs: Retained for up to 1 year, then deleted (unless required longer for security or legal reasons).</li>
          <li>Parent/guardian mobile numbers: Retained only while needed for attendance SMS notifications.</li>
        </ul>
        <p className="text-slate-600 leading-relaxed text-sm">Full retention details are provided in the Privacy Policy.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">9. Contact</h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-slate-600 text-sm mb-1"><strong>Grievance Officer / Data Protection Contact</strong></p>
          <p className="text-slate-600 text-sm"><strong>Email:</strong> <a href="mailto:jagadeesanrv@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jagadeesanrv@jjcet.ac.in</a></p>
        </div>

        <p className="mt-6 text-sm text-slate-500 italic">Approved by: Principal's Office, JJCET</p>
      </main>

      <footer className="py-6 text-center text-xs font-semibold text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
