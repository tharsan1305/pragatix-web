import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DpdpCompliancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <Link to="/" className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors" title="Back to Landing Page">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="type-h5 text-white">DPDP Compliance</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <span className="type-caption inline-block bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 rounded-full mb-3">Legal &amp; Compliance</span>
        <h1 className="type-h2 text-slate-900 mb-2">Digital Personal Data Protection (DPDP) Compliance</h1>
        <div className="type-body-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <span><strong>Version:</strong> 1.4</span>
          <span className="ml-4"><strong>Effective Date:</strong> August 11, 2026</span>
        </div>
        <p className="type-body-sm text-slate-600 mb-6">PragatiX is committed to protecting personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the applicable Rules.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">1. Data Fiduciary</h2>
        <p className="type-body-sm text-slate-600">J.J. College of Engineering and Technology (JJCET), Tiruchirappalli, operating the PragatiX platform, is the Data Fiduciary responsible for the personal data processed through the PragatiX system.</p>
        <p className="type-body-sm text-slate-600">JJCET is not currently classified as a Significant Data Fiduciary (SDF) under the DPDP Rules, 2025.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">2. Purpose of Processing</h2>
        <p className="type-body-sm text-slate-600">Personal data is collected and processed only for the following legitimate purposes:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Academic administration and student performance management</li>
          <li>Attendance tracking and related notifications</li>
          <li>Discipline and XP scoring</li>
          <li>Complaint management</li>
          <li>Communication with students and authorised staff</li>
          <li>Sending attendance-related SMS notifications to registered parent/guardian mobile numbers</li>
        </ul>
        <p className="type-body-sm text-slate-600">We do not sell, rent, or commercially exploit personal data.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">3. Data We Process</h2>
        <p className="type-body-sm text-slate-600">We process only the personal data that is necessary for the purposes stated above. This includes (but is not limited to):</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Student identification and academic records</li>
          <li>Attendance data</li>
          <li>Discipline and performance scores</li>
          <li>Contact details of students</li>
          <li>Parent/guardian mobile numbers (solely for SMS notifications)</li>
          <li>Login and authentication-related data required for secure access</li>
        </ul>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">4. Data Sharing</h2>
        <p className="type-body-sm text-slate-600">Personal data is shared only with:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Authorised internal users of JJCET under role-based access control</li>
          <li>Third-party service providers who process data on our behalf strictly for technical operations (cloud hosting, email delivery, and SMS delivery)</li>
        </ul>
        <p className="type-body-sm text-slate-600">We do not share personal data with Anna University, AICTE, or any other external body except where required by law.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">5. Security Safeguards</h2>
        <p className="type-body-sm text-slate-600">We implement reasonable security safeguards to protect personal data, including:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Role-based access control</li>
          <li>Secure authentication mechanisms</li>
          <li>Encryption of data in transit</li>
          <li>Platform-level security controls on our hosting infrastructure</li>
          <li>Regular review of access permissions</li>
        </ul>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">6. Data Retention</h2>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Academic and official student records are retained as required under applicable university and institutional regulations.</li>
          <li>Operational and activity logs are retained for a limited period necessary for system security, audit, and operational purposes, after which they are deleted or anonymised.</li>
          <li>Parent mobile numbers used solely for SMS notifications are retained only while the student remains enrolled or as required for communication purposes.</li>
        </ul>
        <p className="type-body-sm text-slate-600">When data is no longer required for the stated purposes or legal obligations, it will be deleted or anonymised in a secure manner. See our <Link to="/data-deletion" className="text-indigo-600 hover:text-indigo-800 underline">Account &amp; Data Deletion Policy</Link> for how to request this.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">7. Your Rights as a Data Principal</h2>
        <p className="type-body-sm text-slate-600">Under the DPDP Act, you have the right to:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Request access to your personal data</li>
          <li>Request correction of inaccurate or incomplete personal data</li>
          <li>Request erasure of personal data (subject to legal and academic retention requirements)</li>
          <li>Withdraw consent where processing is based on consent</li>
          <li>Nominate another person to exercise your rights in case of death or incapacity (as provided under the Act)</li>
          <li>Lodge a grievance regarding the processing of your personal data</li>
        </ul>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">8. How to Exercise Your Rights or Raise a Grievance</h2>
        <p className="type-body-sm text-slate-600">Please send a written request to our Grievance Officer stating the right you wish to exercise.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-4">
          <p className="type-body-sm text-slate-600 mb-1"><strong>Jagadeesan R V</strong></p>
          <p className="type-body-sm text-slate-600 mb-1">Placement Head / Admin Officer</p>
          <p className="type-body-sm text-slate-600 mb-1">J.J. College of Engineering and Technology</p>
          <p className="type-body-sm text-slate-600"><strong>Email:</strong> <a href="mailto:jagadeesanrv@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jagadeesanrv@jjcet.ac.in</a></p>
        </div>
        <p className="type-body-sm text-slate-600 mt-4">We will:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Acknowledge your request within 2 business days</li>
          <li>Respond to access and correction requests within a reasonable time</li>
          <li>Process erasure requests subject to applicable legal and institutional retention obligations, and inform you of the outcome</li>
        </ul>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">9. Data Breach Notification</h2>
        <p className="type-body-sm text-slate-600">In the event of a personal data breach that is likely to cause harm to Data Principals, we will notify the Data Protection Board of India and affected individuals as required under the DPDP Act and Rules.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">10. Updates</h2>
        <p className="type-body-sm text-slate-600">This DPDP Compliance statement may be updated from time to time. The latest version will always be available on the PragatiX platform.</p>
        <p className="type-body-sm text-slate-600">For complete details on how we collect, use, and protect personal data, please refer to our Privacy Policy and Cookie &amp; Tracking Policy.</p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6 type-body-sm text-slate-600 text-center">
          J.J. College of Engineering and Technology<br />
          Ammapettai, Poolangulathupatti, Tiruchirappalli, Tamil Nadu 620009
        </div>
      </main>

      <footer className="py-6 text-center type-caption text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
