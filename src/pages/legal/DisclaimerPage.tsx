import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <Link to="/login" className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Disclaimer</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">Legal &amp; Compliance</span>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Disclaimer</h1>
        <div className="text-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <span><strong>Version:</strong> 1.1</span>
          <span className="ml-4"><strong>Effective Date:</strong> August 11, 2026</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-sm mb-6"><strong>Operated by:</strong> J.J. College of Engineering and Technology (JJCET), Tiruchirappalli</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">1. General Disclaimer</h2>
        <p className="text-slate-600 leading-relaxed text-sm">PragatiX is a Student Performance and Discipline Management System provided solely for internal academic and administrative use by JJCET. The information displayed on this platform is provided in good faith. We make no representation or warranty of any kind, express or implied, regarding the completeness, accuracy, reliability, or suitability of any information on the System.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">2. Academic and Discipline Data</h2>
        <p className="text-slate-600 leading-relaxed text-sm">All marks, attendance percentages, discipline/XP scores, badges, and leaderboard rankings displayed on PragatiX are provisional and intended only for academic guidance and internal tracking.</p>
        <p className="text-slate-600 leading-relaxed text-sm">These figures may not reflect final or official results. The official records maintained by the JJCET Registrar's Office / Examination Cell remain the sole authoritative source for all academic transcripts, degree certificates, and formal disciplinary outcomes.</p>
        <p className="text-slate-600 leading-relaxed text-sm">In case of any discrepancy between PragatiX and official college records, the official college records shall prevail.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">3. No Professional or Legal Advice</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Nothing on PragatiX constitutes legal, academic, financial, or professional advice. Any decisions made on the basis of information obtained from the platform are made solely at the user's own discretion and risk.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">4. Third-Party Services</h2>
        <p className="text-slate-600 leading-relaxed text-sm">PragatiX relies on third-party service providers, including Amazon Web Services (hosting), ZeptoMail (email delivery), and Airtel IQ (SMS delivery). We are not responsible for service interruptions, delays, failures, or data issues caused by these third parties, or for the content of any third-party website that may be linked from PragatiX.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">5. System Availability</h2>
        <p className="text-slate-600 leading-relaxed text-sm">PragatiX is provided on an "as available" basis. We do not guarantee uninterrupted, timely, secure, or error-free operation of the platform. We shall not be liable for any loss or damage arising from System downtime, technical errors, data unavailability, or maintenance activities.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">6. Notifications</h2>
        <p className="text-slate-600 leading-relaxed text-sm">SMS and email notifications (including attendance, discipline, or approval alerts) are sent as a courtesy service and are subject to network and delivery limitations beyond our control.</p>
        <p className="text-slate-600 leading-relaxed text-sm">Non-receipt of a notification does not exempt any student from academic or disciplinary obligations that have been communicated through official college channels.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">7. User-Generated Content</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Complaints, activity submissions, and other content submitted by users reflect the views of the individual who submitted them and do not necessarily represent the views of JJCET.</p>
        <p className="text-slate-600 leading-relaxed text-sm">We reserve the right to review, moderate, or remove any content that violates our Terms of Service or is otherwise inappropriate.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">8. Limitation of Liability</h2>
        <p className="text-slate-600 leading-relaxed text-sm">To the maximum extent permitted by applicable law, JJCET disclaims all liability for any direct, indirect, incidental, special, or consequential loss or damage arising from the use of, or reliance on, information provided through PragatiX, except where such liability arises from gross negligence or willful misconduct.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">9. Changes to This Disclaimer</h2>
        <p className="text-slate-600 leading-relaxed text-sm">This Disclaimer may be updated from time to time. The latest version will be published on the PragatiX platform. Continued use of the System after any changes constitutes acceptance of the revised Disclaimer.</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">10. Contact</h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-slate-600 text-sm"><strong>Email:</strong> <a href="mailto:jjcetpm@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jjcetpm@jjcet.ac.in</a></p>
        </div>

        <p className="mt-6 text-sm text-slate-500 italic">Approved by: Principal's Office, JJCET</p>
      </main>

      <footer className="py-6 text-center text-xs font-semibold text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
