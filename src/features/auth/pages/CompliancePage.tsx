import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CompliancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  let title = "";
  let content = null;

  if (path === '/terms') {
    title = "Terms of Service";
    content = (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          Welcome to the PragatiX Discipline Portal. By accessing or using our platform, you agree to comply with and be bound by the following terms and conditions.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">1. Usage License</h3>
        <p className="text-slate-600 leading-relaxed">
          The portal is provided exclusively to registered students, faculty, and administrators of JJCET. Unauthorized access, sharing of credentials, or scraping of portal data is strictly prohibited.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">2. Acceptable Conduct</h3>
        <p className="text-slate-600 leading-relaxed">
          Users must log activity claims and verify attendance truthfully. Falsifying documentation, evidence links, or details is a violation of institutional policy and may result in point deductions or disciplinary action.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">3. Account Security</h3>
        <p className="text-slate-600 leading-relaxed">
          You are responsible for safeguarding your login credentials and verifying access through OTP code confirmation. Report any security breaches to the portal administrator immediately.
        </p>
      </div>
    );
  } else if (path === '/privacy') {
    title = "Privacy Policy";
    content = (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          Your privacy is extremely important to us. This Privacy Policy details how we handle academic, behavioral, and data metrics.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">1. Information We Collect</h3>
        <p className="text-slate-600 leading-relaxed">
          We collect name, register number, academic department, activity submission records, and attendance logs. Evidence URLs submitted for badge claims are stored for faculty review.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">2. Data Utilization</h3>
        <p className="text-slate-600 leading-relaxed">
          Collected data is used to calculate behavioral XP progression, assign levels, award badges, track class-level attendance summaries, and compile department analytics reports.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">3. Sharing & Disclosures</h3>
        <p className="text-slate-600 leading-relaxed">
          Academic and behavior metrics are shared internally with your Class Coordinator, HOD, and institutional administrators. Data is not shared with any external third-party advertisers.
        </p>
      </div>
    );
  } else if (path === '/security') {
    title = "Security Architecture";
    content = (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          PragatiX utilizes industry-standard security frameworks to protect student data and backend resources.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">1. Access Controls (RBAC)</h3>
        <p className="text-slate-600 leading-relaxed">
          Strict Role-Based Access Control (RBAC) restricts administrative actions to authorized accounts. Student level logs, coordinator rosters, and super-admin panels are isolated at the API gateway layer.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">2. Data Encryption</h3>
        <p className="text-slate-600 leading-relaxed">
          All communications are encrypted in transit over HTTPS. Sensitive authentication details and passwords are encrypted using secure cryptographic hashing algorithms before being stored.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">3. Session Validation</h3>
        <p className="text-slate-600 leading-relaxed">
          Token-based JSON Web Token (JWT) sessions expire automatically to prevent unauthorized session hijackings on shared machines or mobile interfaces.
        </p>
      </div>
    );
  } else if (path === '/cookies') {
    title = "Cookies Policy";
    content = (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          We use cookies and equivalent browser local storage mechanisms to improve your authentication session experience.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">1. Necessary Cookies</h3>
        <p className="text-slate-600 leading-relaxed">
          These cookies are essential for you to sign in and securely access your student dashboard. Disabling these via browser preferences will prevent successful portal login.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">2. Preference Storage</h3>
        <p className="text-slate-600 leading-relaxed">
          Browser local storage keeps your JWT authentication token cached so you do not need to sign in again every time you open a tab.
        </p>
      </div>
    );
  } else if (path === '/dpdp-compliance') {
    title = "DPDP Compliance";
    content = (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          We comply with the Digital Personal Data Protection (DPDP) Act.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">1. Clear Consent</h3>
        <p className="text-slate-600 leading-relaxed">
          Personal identity details and academic activity submissions are processed solely with explicit institutional mandate for tracking academic excellence.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">2. Right to Correction</h3>
        <p className="text-slate-600 leading-relaxed">
          Students can request correction or updates to their register details, department, or active group status through their Class Coordinator.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">3. Data Principal Grievances</h3>
        <p className="text-slate-600 leading-relaxed">
          Any inquiries regarding the processing of personal data can be forwarded to the Head of Department or designated Compliance Officer.
        </p>
      </div>
    );
  } else if (path === '/disclaimer') {
    title = "General Disclaimer";
    content = (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          The PragatiX discipline portal is designed to encourage professional development, attendance, and activity progression.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">1. Points and Rewards</h3>
        <p className="text-slate-600 leading-relaxed">
          XP levels, leaderboard rankings, and badge rewards are educational tools. They are subject to administrative adjustments and do not constitute absolute legal guarantees of external achievements.
        </p>
        <h3 className="text-lg font-bold text-slate-800 mt-6">2. Third-Party Links</h3>
        <p className="text-slate-600 leading-relaxed">
          Evidence URLs uploaded for badge claims link to third-party file drives and platforms. JJCET is not responsible for the contents or availability of these external links.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center shadow-md sticky top-0">
        <button onClick={() => navigate('/login')} className="mr-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 my-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6 border-b border-slate-100 pb-4">{title}</h2>
        {content}
      </main>

      <footer className="py-6 text-center text-xs font-semibold text-slate-400 border-t border-slate-200">
        JJCET © 2026 · PragatiX Compliance Documents
      </footer>
    </div>
  );
}
