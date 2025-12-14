import { Settings as SettingsIcon, User, Shield, Bell, Database } from 'lucide-react';

const settingsSections = [
  { icon: User, title: 'User Management', description: 'Manage users, roles, and permissions' },
  { icon: Shield, title: 'Security', description: 'Configure 2FA, SSO, and access controls' },
  { icon: Bell, title: 'Notifications', description: 'Set up email and system alerts' },
  { icon: Database, title: 'Data & Export', description: 'Manage data retention and exports' },
];

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure system settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => (
          <div 
            key={section.title}
            className="rounded-lg border bg-card p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{section.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
