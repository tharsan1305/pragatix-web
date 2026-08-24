import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <Link to="/" className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors" title="Back to Landing Page">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="type-h5 text-white">Privacy Policy</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <span className="type-caption inline-block bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 rounded-full mb-3">Legal &amp; Compliance</span>
        <h1 className="type-h2 text-slate-900 mb-2">Privacy Policy</h1>
        <div className="type-body-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <span><strong>Version:</strong> 1.4</span>
          <span className="ml-4"><strong>Effective Date:</strong> August 11, 2026</span>
        </div>
        <p className="type-body-sm text-slate-600 mb-6"><strong>Operated by:</strong> J.J. College of Engineering and Technology (JJCET), Tiruchirappalli</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">1. Introduction</h2>
        <p className="type-body-sm text-slate-600">This Privacy Policy explains how PragatiX collects, uses, stores, and protects personal data of students, teachers, and staff of JJCET. We comply with the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Rules.</p>
        <p className="type-body-sm text-slate-600">By using PragatiX (web or mobile application), you agree to the practices described in this Policy, our Terms of Service, and our Cookie &amp; Tracking Policy.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">2. Information We Collect</h2>
        <p className="type-body-sm text-slate-600">We collect only the personal data necessary for the operation of PragatiX:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li><strong>Identity Data:</strong> Name, roll number/register number, role, department, year/section</li>
          <li><strong>Contact Data:</strong> Email address, mobile number, permanent address (of students and staff)</li>
          <li><strong>Academic Data:</strong> Attendance records, marks/grades, examination results</li>
          <li><strong>Discipline Data:</strong> Discipline/XP scores, badges, complaints, rewards</li>
          <li><strong>Authentication Data:</strong> Login credentials and OTP verification logs</li>
          <li><strong>Technical Data:</strong> IP address, device/browser information, and access logs (for security and operational purposes)</li>
          <li><strong>Parent/Guardian Mobile Number:</strong> Stored solely for the purpose of sending attendance-related SMS notifications</li>
        </ul>
        <p className="type-body-sm text-slate-600">We do not collect biometric data or photographs. We do not use cookies. Authentication is handled through secure token-based mechanisms (see our Cookie &amp; Tracking Policy).</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">3. How We Use Your Information</h2>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Academic administration (attendance, marks, discipline/XP tracking)</li>
          <li>Secure authentication and access control</li>
          <li>Sending SMS (via Airtel IQ) and email (via ZeptoMail) notifications to students regarding academic and disciplinary matters</li>
          <li>Sending attendance-related SMS notifications to the registered parent/guardian mobile number</li>
          <li>Internal institutional reporting for authorised college staff</li>
        </ul>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">4. Legal Basis for Processing</h2>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Consent (where applicable, at the time of account activation)</li>
          <li>Legitimate use for educational and administrative purposes of JJCET</li>
        </ul>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">5. Sharing of Information</h2>
        <p className="type-body-sm text-slate-600">We do not sell or rent personal data. Data is shared only with:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Authorised internal users of JJCET under Role-Based Access Control (Teachers, Class Coordinators/Captains, HODs, and Admins - limited to the data relevant to their role)</li>
          <li>Parent/guardian mobile numbers are used only to send attendance SMS notifications</li>
          <li>Data Processors who process data on our behalf under confidentiality obligations: Amazon Web Services (Mumbai, India) - hosting; ZeptoMail - email delivery; Airtel IQ - SMS delivery</li>
        </ul>
        <p className="type-body-sm text-slate-600">Student and staff data is retained and used solely within JJCET and is not shared with Anna University, AICTE, or any other external accreditation or government body, except where required by law.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">6. Data Storage and Security</h2>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Data is hosted on AWS infrastructure in Mumbai (ap-south-1) with encryption in transit.</li>
          <li>Access is controlled through Role-Based Access Control (RBAC).</li>
          <li>We apply appropriate technical and organisational security measures, including platform-level protections and secure authentication.</li>
          <li>Authentication uses OTP verification and secure token-based sessions. The maximum session duration is 16 hours.</li>
        </ul>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">7. Data Breach Notification</h2>
        <p className="type-body-sm text-slate-600">In the event of a personal data breach that is likely to cause harm, we will notify the Data Protection Board of India and affected individuals as required under the DPDP Act and Rules.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">8. Data Retention</h2>
        <p className="type-body-sm text-slate-600">We retain different categories of data for different periods:</p>
        <div className="w-full border-collapse my-4 type-body-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-slate-50 text-slate-800 font-semibold p-2 border border-slate-200 text-left type-table-head">Category</th>
                <th className="bg-slate-50 text-slate-800 font-semibold p-2 border border-slate-200 text-left type-table-head">Retention</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-200 type-body-sm text-slate-600">Academic &amp; Discipline Records (marks, attendance, XP scores, complaints, rewards)</td>
                <td className="p-2 border border-slate-200 type-body-sm text-slate-600">Duration of enrollment and thereafter, as required for academic history, transcripts, verification, and legal obligations. Not deleted upon account deactivation.</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 type-body-sm text-slate-600">Session, Activity &amp; Technical Logs</td>
                <td className="p-2 border border-slate-200 type-body-sm text-slate-600">Up to 1 year from creation, then deleted, unless required longer for security investigation or legal compliance</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 type-body-sm text-slate-600">Parent/Guardian Mobile Numbers</td>
                <td className="p-2 border border-slate-200 type-body-sm text-slate-600">Retained only while needed for attendance SMS notifications, or as required by institutional policy</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 type-body-sm text-slate-600">Inactive Accounts</td>
                <td className="p-2 border border-slate-200 type-body-sm text-slate-600">Deactivated (not immediately deleted) upon graduation, exit, or prolonged inactivity. Associated academic records continue to be retained per above.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="type-body-sm text-slate-600">See our <Link to="/data-deletion" className="text-indigo-600 hover:text-indigo-800 underline">Account &amp; Data Deletion Policy</Link> for how to request deletion of your account and eligible data.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">9. Your Rights</h2>
        <p className="type-body-sm text-slate-600">Under the DPDP Act, 2023, you have the right to:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Request access to your personal data</li>
          <li>Request correction of inaccurate or incomplete data</li>
          <li>Request erasure of personal data (subject to legal and academic retention requirements)</li>
          <li>Withdraw consent where processing is based on consent</li>
          <li>Raise a grievance regarding the handling of your personal data</li>
        </ul>
        <p className="type-body-sm text-slate-600">Requests will be acknowledged within 2 business days and processed within a reasonable time, subject to the retention rules in Section 8.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">10. Children's Data</h2>
        <p className="type-body-sm text-slate-600">Where students under 18 years of age use the System, their data is processed as part of the educational relationship with JJCET. Parent/guardian mobile numbers are used only for attendance-related SMS notifications.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">11. Grievance Officer</h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="type-body-sm text-slate-600 mb-1"><strong>Jagadeesan R V</strong></p>
          <p className="type-body-sm text-slate-600 mb-1">Placement Head / Admin Officer</p>
          <p className="type-body-sm text-slate-600 mb-1">J.J. College of Engineering and Technology</p>
          <p className="type-body-sm text-slate-600"><strong>Email:</strong> <a href="mailto:jagadeesanrv@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jagadeesanrv@jjcet.ac.in</a></p>
          <p className="type-body-sm text-slate-600"><strong>Phone:</strong> 73058 11776</p>
        </div>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">12. Changes to This Policy</h2>
        <p className="type-body-sm text-slate-600">We may update this Privacy Policy from time to time. Material changes will be notified through the System and/or by email or SMS to registered users. The latest version will always be available on the PragatiX platform.</p>

        <p className="mt-6 type-body-sm text-slate-500 italic">Approved by: Principal's Office, JJCET</p>
      </main>

      <footer className="py-6 text-center type-caption text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
