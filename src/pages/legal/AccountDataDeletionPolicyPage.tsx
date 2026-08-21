import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccountDataDeletionPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <Link to="/login" className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-heading text-lg font-bold">Account &amp; Data Deletion Policy</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">Legal &amp; Compliance</span>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900 mb-2">Account &amp; Data Deletion Policy</h1>
        <div className="text-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <span><strong>Version:</strong> 1.0</span>
          <span className="ml-4"><strong>Effective Date:</strong> August 11, 2026</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-sm mb-6"><strong>Operated by:</strong> J.J. College of Engineering and Technology (JJCET), Tiruchirappalli</p>

        <h2 className="font-heading text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">1. Overview</h2>
        <p className="text-slate-600 leading-relaxed text-sm">This policy explains how you can request deletion of your PragatiX account and associated personal data, what happens after you submit a request, and what data may be retained even after deletion, in accordance with applicable law and academic record-keeping requirements.</p>

        <h2 className="font-heading text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">2. Who Can Request Deletion</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Any registered user of PragatiX - student, parent/guardian, teacher, or staff member - may request deletion of their account and personal data. For students under 18, a parent or guardian may submit the request on the student's behalf.</p>

        <h2 className="font-heading text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">3. How to Request Account &amp; Data Deletion</h2>
        <p className="text-slate-600 leading-relaxed text-sm">To request deletion of your PragatiX account and associated personal data, please send an email to <strong>jjcetpm@jjcet.ac.in</strong> with the subject line <strong>"Account Deletion Request"</strong>, using the template below. Including all requested details helps us verify your account and process your request faster.</p>

        <div className="bg-slate-50 border border-slate-200 border-l-4 border-l-indigo-500 rounded-lg p-4 mt-4 text-sm font-mono whitespace-pre-wrap text-slate-700">To: jjcetpm@jjcet.ac.in
Subject: Account Deletion Request

Full Name: [Your full name as registered on PragatiX]
Registered Email: [Email used to log in to PragatiX]
Registered Mobile Number: [Mobile number linked to your account]
Role: [Student / Parent-Guardian / Teacher / Staff]
Roll Number / Register Number: [If applicable]
Reason for Deletion (optional): [Optional]

I am requesting permanent deletion of my PragatiX account and 
associated personal data, subject to applicable academic and 
legal retention requirements.</div>

        <p className="text-slate-600 leading-relaxed text-sm mt-4">Once we receive your request, we will verify your identity and take action within <strong>72 hours</strong>.</p>

        <h2 className="font-heading text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">4. What Happens After You Submit a Request</h2>
        <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li><strong>Submission:</strong> You send your deletion request by email using the template in Section 3.</li>
          <li><strong>Identity Verification:</strong> We will verify the request matches the registered account, using the email/phone number and role provided. We may reply to confirm the request is genuine.</li>
          <li><strong>Review:</strong> Your request is reviewed to determine which data can be deleted immediately and which data must be retained under academic or legal obligations (see Section 5).</li>
          <li><strong>Action:</strong> Your account and eligible personal data will be deleted or anonymized within <strong>72 hours</strong> of a verified request.</li>
          <li><strong>Confirmation:</strong> You will receive a confirmation email once the deletion has been completed.</li>
        </ol>

        <h2 className="font-heading text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">5. What Gets Deleted vs. What Is Retained</h2>
        <p className="text-slate-600 leading-relaxed text-sm"><strong>Deleted upon request (within 72 hours):</strong></p>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>Login credentials and account access</li>
          <li>Contact information (email, phone, address) not required for academic records</li>
          <li>Session and authentication tokens</li>
          <li>Parent/guardian mobile number stored for notifications</li>
        </ul>
        <p className="text-slate-600 leading-relaxed text-sm"><strong>Retained even after account deletion (as required by academic and legal obligations):</strong></p>
        <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600 text-sm">
          <li>Academic records (marks, attendance, examination results) required for transcripts, degree verification, or institutional audit</li>
          <li>Discipline records required for institutional compliance or ongoing proceedings</li>
          <li>Any data we are legally required to retain under applicable Indian law</li>
        </ul>
        <p className="text-slate-600 leading-relaxed text-sm">Where full deletion is not possible due to these obligations, we will anonymize the data where feasible, removing identifying information while retaining what is institutionally or legally required.</p>

        <h2 className="font-heading text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">6. Deletion Requests for Minors</h2>
        <p className="text-slate-600 leading-relaxed text-sm">Where the user is under 18, deletion requests must be submitted by a parent or guardian. We may request proof of relationship to the student before processing the request.</p>

        <h2 className="font-heading text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">7. Contact Us</h2>
        <p className="text-slate-600 leading-relaxed text-sm">For any questions regarding account or data deletion, mail us directly using the details below.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-slate-600 text-sm mb-1"><strong>J.J. College of Engineering and Technology</strong></p>
          <p className="text-slate-600 text-sm"><strong>Email:</strong> <a href="mailto:jjcetpm@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jjcetpm@jjcet.ac.in</a></p>
        </div>

        <h2 className="font-heading text-lg font-bold text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">8. Changes to This Policy</h2>
        <p className="text-slate-600 leading-relaxed text-sm">We may update this policy periodically. The latest version will always be available on the PragatiX platform.</p>

        <p className="mt-6 text-sm text-slate-500 italic">Approved by: Principal's Office, JJCET</p>
      </main>

      <footer className="py-6 text-center text-xs font-semibold text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
