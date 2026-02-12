"use client";

import { useState } from "react";
import clsx from "clsx";
import { Copy, Check } from "lucide-react";

type Language = "curl" | "python" | "node" | "ruby";

const LANGUAGES: { id: Language; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "python", label: "Python" },
  { id: "node", label: "Node.js" },
  { id: "ruby", label: "Ruby" },
];

type ExampleGroup = {
  title: string;
  description: string;
  snippets: Record<Language, string>;
};

const EXAMPLES: ExampleGroup[] = [
  {
    title: "List Employees",
    description: "Fetch all active employees in your workspace.",
    snippets: {
      curl: `curl -X GET "https://api.qeemly.com/api/v1/employees?status=active" \\
  -H "Authorization: Bearer qeem_your_api_key" \\
  -H "Content-Type: application/json"`,
      python: `import requests

response = requests.get(
    "https://api.qeemly.com/api/v1/employees",
    headers={"Authorization": "Bearer qeem_your_api_key"},
    params={"status": "active"}
)

employees = response.json()["data"]
print(f"Found {len(employees)} employees")`,
      node: `const response = await fetch(
  "https://api.qeemly.com/api/v1/employees?status=active",
  {
    headers: {
      "Authorization": "Bearer qeem_your_api_key",
      "Content-Type": "application/json",
    },
  }
);

const { data: employees } = await response.json();
console.log(\`Found \${employees.length} employees\`);`,
      ruby: `require "net/http"
require "json"

uri = URI("https://api.qeemly.com/api/v1/employees?status=active")
req = Net::HTTP::Get.new(uri)
req["Authorization"] = "Bearer qeem_your_api_key"

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http|
  http.request(req)
}

employees = JSON.parse(res.body)["data"]
puts "Found #{employees.length} employees"`,
    },
  },
  {
    title: "Push Employee Data",
    description: "Create or update employees in bulk from your HRIS.",
    snippets: {
      curl: `curl -X POST "https://api.qeemly.com/api/v1/employees" \\
  -H "Authorization: Bearer qeem_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "employees": [
      {
        "first_name": "Sarah",
        "last_name": "Ahmed",
        "email": "sarah@company.com",
        "department": "Engineering",
        "role_id": "software_engineer",
        "level_id": "senior",
        "location_id": "dubai",
        "base_salary": 45000,
        "currency": "AED"
      }
    ]
  }'`,
      python: `import requests

response = requests.post(
    "https://api.qeemly.com/api/v1/employees",
    headers={
        "Authorization": "Bearer qeem_your_api_key",
        "Content-Type": "application/json",
    },
    json={
        "employees": [
            {
                "first_name": "Sarah",
                "last_name": "Ahmed",
                "email": "sarah@company.com",
                "department": "Engineering",
                "role_id": "software_engineer",
                "level_id": "senior",
                "location_id": "dubai",
                "base_salary": 45000,
                "currency": "AED",
            }
        ]
    }
)

result = response.json()
print(f"Created: {result['created']}, Updated: {result['updated']}")`,
      node: `const response = await fetch(
  "https://api.qeemly.com/api/v1/employees",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer qeem_your_api_key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      employees: [
        {
          first_name: "Sarah",
          last_name: "Ahmed",
          email: "sarah@company.com",
          department: "Engineering",
          role_id: "software_engineer",
          level_id: "senior",
          location_id: "dubai",
          base_salary: 45000,
          currency: "AED",
        },
      ],
    }),
  }
);

const result = await response.json();
console.log(\`Created: \${result.created}, Updated: \${result.updated}\`);`,
      ruby: `require "net/http"
require "json"

uri = URI("https://api.qeemly.com/api/v1/employees")
req = Net::HTTP::Post.new(uri)
req["Authorization"] = "Bearer qeem_your_api_key"
req["Content-Type"] = "application/json"
req.body = {
  employees: [
    {
      first_name: "Sarah",
      last_name: "Ahmed",
      email: "sarah@company.com",
      department: "Engineering",
      role_id: "software_engineer",
      level_id: "senior",
      location_id: "dubai",
      base_salary: 45000,
      currency: "AED"
    }
  ]
}.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http|
  http.request(req)
}

result = JSON.parse(res.body)
puts "Created: #{result['created']}, Updated: #{result['updated']}"`,
    },
  },
  {
    title: "Verify Webhook Signature",
    description: "Validate incoming webhook payloads from Qeemly.",
    snippets: {
      curl: `# Not applicable for cURL - use server-side verification`,
      python: `import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

# In your webhook handler:
# signature = request.headers["X-Qeemly-Signature"]
# is_valid = verify_webhook(request.body, signature, "your_webhook_secret")`,
      node: `import crypto from "crypto";

function verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return signature === \`sha256=\${expected}\`;
}

// In your webhook handler:
// const signature = req.headers["x-qeemly-signature"];
// const isValid = verifyWebhook(req.body, signature, "your_secret");`,
      ruby: `require "openssl"

def verify_webhook(payload, signature, secret)
  expected = OpenSSL::HMAC.hexdigest("SHA256", secret, payload)
  Rack::Utils.secure_compare("sha256=#{expected}", signature)
end

# In your webhook handler:
# signature = request.headers["X-Qeemly-Signature"]
# is_valid = verify_webhook(request.body.read, signature, "your_secret")`,
    },
  },
];

export function CodeExamples() {
  const [activeLanguage, setActiveLanguage] = useState<Language>("curl");
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedExample(id);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-brand-900">Code Examples</h3>
        <p className="mt-0.5 text-xs text-brand-500">
          Copy-paste examples to get started with the Qeemly API.
        </p>
      </div>

      {/* Language Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-brand-50 p-1 w-fit">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setActiveLanguage(lang.id)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeLanguage === lang.id
                ? "bg-white text-brand-900 shadow-sm"
                : "text-brand-600 hover:text-brand-800"
            )}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Examples */}
      <div className="space-y-5">
        {EXAMPLES.map((example, index) => {
          const snippet = example.snippets[activeLanguage];
          const exampleKey = `${index}-${activeLanguage}`;

          return (
            <div key={index} className="space-y-2">
              <div>
                <h4 className="text-xs font-semibold text-brand-800">{example.title}</h4>
                <p className="text-[11px] text-brand-500">{example.description}</p>
              </div>

              <div className="relative">
                <pre className="rounded-xl bg-brand-900 p-4 text-[11px] font-mono text-brand-100 overflow-x-auto leading-relaxed">
                  {snippet}
                </pre>

                <button
                  onClick={() => handleCopy(snippet, exampleKey)}
                  className="absolute right-2 top-2 rounded-lg bg-brand-800 p-1.5 text-brand-300 hover:text-white transition-colors"
                >
                  {copiedExample === exampleKey ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
