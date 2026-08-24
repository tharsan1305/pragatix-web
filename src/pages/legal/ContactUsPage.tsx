import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <Link to="/" className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors" title="Back to Landing Page">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="type-h5 text-white">Contact Us</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <span className="type-caption inline-block bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 rounded-full mb-3">Contact</span>
        <h1 className="type-h2 text-slate-900 mb-2">Contact Us</h1>
        <p className="type-body-sm text-slate-500 mb-6 pb-4 border-b border-slate-100">We're here to help. Choose the right contact below for a faster response.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h4 className="type-h6 text-slate-800 mb-2">General &amp; PragatiX Support</h4>
            <p className="type-body-sm text-slate-600 mb-2">For login issues, account access, attendance/marks queries, or general questions about PragatiX.</p>
            <p className="type-body-sm text-slate-600"><strong>Email:</strong> <a href="mailto:jjcetpm@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jjcetpm@jjcet.ac.in</a></p>
            <p className="type-body-sm text-slate-600"><strong>Phone:</strong> 73058 11776</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h4 className="type-h6 text-slate-800 mb-2">Principal's Office</h4>
            <p className="type-body-sm text-slate-600 mb-2">For official institutional correspondence.</p>
            <p className="type-body-sm text-slate-600"><strong>Email:</strong> <a href="mailto:jjcetpm@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jjcetpm@jjcet.ac.in</a></p>
            <p className="type-body-sm text-slate-600"><strong>Phone:</strong> 98428 11776</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h4 className="type-h6 text-slate-800 mb-2">Data Privacy &amp; DPDP Requests</h4>
            <p className="type-body-sm text-slate-600 mb-2">To access, correct, or request erasure of your personal data.</p>
            <p className="type-body-sm text-slate-600"><strong>Grievance Officer:</strong> Jagadeesan R V</p>
            <p className="type-body-sm text-slate-600"><strong>Email:</strong> <a href="mailto:jagadeesanrv@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jagadeesanrv@jjcet.ac.in</a></p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h4 className="type-h6 text-slate-800 mb-2">Account &amp; Data Deletion</h4>
            <p className="type-body-sm text-slate-600 mb-2">To request deletion of your PragatiX account and data.</p>
            <p className="type-body-sm text-slate-600"><strong>Email:</strong> <a href="mailto:jjcetpm@jjcet.ac.in" className="text-indigo-600 hover:text-indigo-800 underline">jjcetpm@jjcet.ac.in</a></p>
            <p className="type-body-sm text-slate-600">See <Link to="/data-deletion" className="text-indigo-600 hover:text-indigo-800 underline">Account &amp; Data Deletion Policy</Link> for the request template.</p>
          </div>
        </div>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">Registered Office</h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="type-body-sm text-slate-600 mb-1"><strong>J.J. College of Engineering and Technology (JJCET)</strong></p>
          <p className="type-body-sm text-slate-600 mb-1">Ammapettai, Poolangulathupatti Post</p>
          <p className="type-body-sm text-slate-600 mb-1">Tiruchirappalli, Tamil Nadu 620009, India</p>
          <p className="type-body-sm text-slate-600"><strong>Website:</strong> <a href="https://jjcet.ac.in" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">jjcet.ac.in</a></p>
        </div>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">Office Hours</h2>
        <p className="type-body-sm text-slate-600">Monday – Friday: 9:00 AM – 5:00 PM IST<br />Saturday: 9:00 AM – 1:00 PM IST (1st &amp; 3rd Saturdays only)<br />Sunday &amp; Public Holidays: Closed</p>

        <h2 className="type-h4 text-slate-800 mt-6 mb-3 pb-2 border-b-2 border-slate-100">Student Welfare &amp; Grievance Committees</h2>
        <p className="type-body-sm text-slate-600">For matters relating to ragging, harassment, or general student grievances, please contact the relevant committee directly through JJCET's official channels:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h4 className="font-semibold text-slate-800 mb-2">Anti-Ragging Committee</h4>
            <p className="type-body-sm text-slate-600 mb-2">Full committee details available on the official college website.</p>
            <p className="type-body-sm text-slate-600"><a href="https://jjcet.ac.in/commitee/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">jjcet.ac.in/commitee</a></p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h4 className="font-semibold text-slate-800 mb-2">Internal Complaints Committee (ICC)</h4>
            <p className="type-body-sm text-slate-600 mb-2">For complaints relating to harassment, under POSH guidelines.</p>
            <p className="type-body-sm text-slate-600"><a href="https://jjcet.ac.in/commitee/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">jjcet.ac.in/commitee</a></p>
          </div>
        </div>

        <p className="type-body-sm text-slate-600 mt-4">You may also use JJCET's official <a href="https://jjcet.ac.in/grievance-redressal-form/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">Grievance Redressal Form</a> for institution-wide concerns not specific to PragatiX.</p>

        <p className="mt-6 type-body-sm text-slate-500 italic">Approved by: Principal's Office, JJCET</p>
      </main>

      <footer className="py-6 text-center type-caption text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
