import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — ApplySafe",
};

export default function PrivacyPage() {
  return (
    <main className="privacy">
      <h1>Privacy</h1>
      <p className="lede">What happens to a message you paste into ApplySafe.</p>

      <h2>This page</h2>
      <p>
        The text is sent to the ApplySafe server so the rules can run. The
        verdict and the highlighted phrases come back. The message is not
        written to a database and there is no account.
      </p>
      <p>
        Do not paste a real social insurance number, a passport photo, or a
        bank password. The checker looks at the words around a request. It does
        not need the number itself.
      </p>

      <h2>What is stored</h2>
      <p>
        A scan can append a local log line: the time, a hash of the text, the
        verdict, and the rule ids. The message itself is not written down.
      </p>

      <h2>What this is not</h2>
      <p>
        ApplySafe is not legal advice and not an immigration decision. To
        report a fraud, call the Canadian Anti-Fraud Centre at 1-888-495-8501.
      </p>
    </main>
  );
}
