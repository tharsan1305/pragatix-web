import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <Link to="/" className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors" title="Back to Landing Page">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="type-h5 text-white">Terms of Service</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <span className="type-caption inline-block bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 rounded-full mb-3">Legal &amp; Compliance</span>
        <h1 className="type-h2 text-slate-900 mb-2">Terms of Service</h1>
        <div className="type-body-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <span><strong>Version:</strong> 1.3</span>
          <span className="ml-4"><strong>Effective Date:</strong> August 11, 2026</span>
        </div>
        <p className="type-body-sm text-slate-600 mb-6"><strong>Operated by:</strong> J.J. College of Engineering and Technology (JJCET), Tiruchirappalli</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">1. Acceptance of Terms</h2>
        <p className="type-body-sm text-slate-600">By accessing or using PragatiX (web or mobile application), you agree to be bound by these Terms of Service, the Privacy Policy, and the Cookie &amp; Tracking Policy. If you do not agree, do not use the System.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">2. Description of Service</h2>
        <p className="type-body-sm text-slate-600">PragatiX is a Student Performance and Discipline Management System (SPDMS) for JJCET, providing attendance tracking, academic marks, discipline/XP scoring, complaints management, rewards, and notifications for Admins, Teachers/Class Coordinators, Students, and Captains. Parents may receive selected attendance-related notifications via SMS on the registered mobile number.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">3. Eligibility and Account Creation</h2>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Access is limited to Admins, Teachers/Class Coordinators, Students, and Captains of currently enrolled JJCET students.</li>
          <li>There is no public self-registration. Accounts are created only by Admins/Office staff.</li>
          <li>Alumni do not retain active portal access; accounts are marked inactive upon graduation.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials and OTP, and for all activity under your account. You must not share your OTP or credentials with any other person. The institution is not responsible for unauthorised access resulting from your failure to protect these credentials.</li>
        </ul>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">4. User Responsibilities</h2>
        <p className="type-body-sm text-slate-600">You agree not to:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 type-body-sm text-slate-600">
          <li>Access or attempt to access another user's records without authorization;</li>
          <li>Share your login credentials or OTP with any other person;</li>
          <li>Submit false, defamatory, or misleading complaints;</li>
          <li>Use automated means (bots, scrapers) to access the System;</li>
          <li>Reverse-engineer, decompile, or attempt to extract source code from the System;</li>
          <li>Interfere with or disrupt the System, servers, or networks.</li>
        </ul>
        <p className="type-body-sm text-slate-600">Any violation of the JJCET Student Handbook and Code of Conduct also constitutes a breach of these Terms.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">5. Academic and Disciplinary Records</h2>
        <p className="type-body-sm text-slate-600">All marks, attendance percentages, and discipline/XP scores displayed on the portal are provisional and for academic guidance only. Official records maintained by the college registrar/office registers remain the final authority. The System and JJCET shall not be liable for any decisions taken solely on the basis of provisional data shown in PragatiX.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">6. Data Sharing and Data Protection</h2>
        <p className="type-body-sm text-slate-600">Student and staff data collected through PragatiX is used and retained solely within J.J. College of Engineering and Technology (JJCET) and is not shared with Anna University, AICTE, or any other external accreditation or government body, except where legally required.</p>
        <p className="type-body-sm text-slate-600">Parent mobile numbers are stored solely for the purpose of sending attendance-related SMS notifications. Users may request access to, correction of, or deletion of their personal data in accordance with applicable law (including the Digital Personal Data Protection Act, 2023) by contacting the email address provided in Section 17. Requests will be handled as per the institution's retention and data protection practices.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">7. Notifications</h2>
        <p className="type-body-sm text-slate-600">SMS and email notifications regarding attendance, discipline, and academic updates are sent to registered student and/or parent contact details. Delivery is subject to third-party network availability (Airtel IQ, ZeptoMail); the System is not liable for delayed or failed delivery.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">8. Account Suspension, Termination and Deletion</h2>
        <p className="type-body-sm text-slate-600">Accounts may be deactivated by Admins or HODs for misuse, graduation, exit, or disciplinary reasons. Deactivation immediately invalidates the user's login session.</p>
        <p className="type-body-sm text-slate-600">Suspended or inactive profiles are normally archived (not immediately deleted) in accordance with the institution's academic and retention requirements. Users may request permanent deletion of their account and associated personal data - see our <Link to="/data-deletion" className="text-indigo-600 hover:text-indigo-800 underline">Account &amp; Data Deletion Policy</Link>. Such requests will be processed subject to applicable legal and institutional retention obligations.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">9. Intellectual Property</h2>
        <p className="type-body-sm text-slate-600">All content, design, source code, and branding of PragatiX are the property of J.J. College of Engineering and Technology (JJCET). Users may not copy, reproduce, distribute, or create derivative works from System content without prior written permission.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">10. Availability and Modifications</h2>
        <p className="type-body-sm text-slate-600">The System is provided on an "as available" basis without guarantee of uninterrupted operation. We reserve the right to modify, suspend, or discontinue any part of the System, and to update these Terms, at any time.</p>
        <p className="type-body-sm text-slate-600">Material changes to these Terms will be notified through the System (in-app/website notice) and/or by email or SMS to registered users. Continued use of the System after such notice constitutes acceptance of the updated Terms.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">11. Limitation of Liability</h2>
        <p className="type-body-sm text-slate-600">To the maximum extent permitted by law, JJCET is not liable for indirect, incidental, or consequential damages arising from use of the System, except where such liability arises from gross negligence or willful misconduct.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">12. Indemnification</h2>
        <p className="type-body-sm text-slate-600">You agree to indemnify and hold harmless JJCET and its officers and staff from claims, damages, or expenses arising from your misuse of the System or violation of these Terms.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">13. Force Majeure</h2>
        <p className="type-body-sm text-slate-600">Neither party is liable for failure or delay in performance due to causes beyond reasonable control (natural disasters, infrastructure failure, governmental action).</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">14. Severability</h2>
        <p className="type-body-sm text-slate-600">If any provision is found invalid or unenforceable, the remaining provisions continue in full force.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">15. Entire Agreement</h2>
        <p className="type-body-sm text-slate-600">These Terms, together with the Privacy Policy and the Cookie &amp; Tracking Policy, constitute the entire agreement between you and JJCET concerning the use of PragatiX.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">16. Governing Law and Regulatory Deference</h2>
        <p className="type-body-sm text-slate-600">Governed by the laws of India, subject to the exclusive jurisdiction of the courts at Tiruchirappalli (Trichy), Tamil Nadu. These Terms defer to the academic regulations of Anna University and DOTE, Tamil Nadu.</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">17. Contact</h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-4">
          <p className="type-body-sm text-slate-600 mb-1"><strong>J.J. College of Engineering and Technology</strong></p>
          <p className="type-body-sm text-slate-600 mb-1">Ammapettai, Poolangulathupatti, Tiruchirappalli, Tamil Nadu 620009</p>
          <p className="type-body-sm text-slate-600"><strong>Email:</strong> <a href="mailto:jjcetpm@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jjcetpm@jjcet.ac.in</a></p>
        </div>

        <p className="mt-6 type-body-sm text-slate-500 italic">Approved by: Principal's Office, JJCET</p>
      </main>

      <footer className="py-6 text-center type-caption text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
