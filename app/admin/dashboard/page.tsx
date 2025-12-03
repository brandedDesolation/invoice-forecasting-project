"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { 
  FileText, 
  Users, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Database,
  Code,
  Zap
} from "lucide-react";

const stats = [
  {
    name: "Total Invoices",
    value: "1,234",
    change: "+12%",
    changeType: "positive",
    icon: FileText,
  },
  {
    name: "Active Customers",
    value: "89",
    change: "+5%",
    changeType: "positive",
    icon: Users,
  },
  {
    name: "Total Revenue",
    value: "₺2.4M",
    change: "+8%",
    changeType: "positive",
    icon: DollarSign,
  },
  {
    name: "Pending Payments",
    value: "45",
    change: "-3%",
    changeType: "negative",
    icon: AlertTriangle,
  },
];

const recentInvoices = [
  {
    id: "INV-001",
    customer: "ABC Company",
    amount: "₺15,000",
    status: "paid",
    dueDate: "2024-01-15",
  },
  {
    id: "INV-002",
    customer: "XYZ Corp",
    amount: "₺8,500",
    status: "pending",
    dueDate: "2024-01-20",
  },
  {
    id: "INV-003",
    customer: "Demo Ltd",
    amount: "₺12,300",
    status: "overdue",
    dueDate: "2024-01-10",
  },
];

const features = [
  {
    title: "Invoice Data Processing",
    description: "Upload and process invoice data from CSV/Excel files with automated validation and error handling. The system intelligently parses invoice information and prepares it for forecasting analysis.",
    icon: Database,
    technologies: ["Pandas", "SQLAlchemy", "FastAPI"]
  },
  {
    title: "AI-Powered Forecasting",
    description: "Advanced machine learning models analyze historical invoice data to predict future payment patterns, cash flow trends, and potential late payments with high accuracy.",
    icon: Zap,
    technologies: ["Machine Learning", "Python", "Time Series Analysis"]
  },
  {
    title: "Real-time Analytics",
    description: "Comprehensive dashboard with real-time insights, payment trends, and financial analytics. Monitor your business performance with interactive charts and detailed reports.",
    icon: Code,
    technologies: ["React", "Chart.js", "Real-time Data"]
  }
];

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <AdminLayout currentPage="dashboard">
        {/* Dashboard Section */}
        <section className="mb-32 scroll-mt-16 md:mb-40 lg:mb-48 lg:scroll-mt-24" aria-label="Dashboard">
          <div className="sticky top-0 z-20 -mx-6 mb-8 w-screen bg-black/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-100 lg:sr-only">Dashboard</h2>
          </div>
          
          <div>
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
              <p className="text-white/70">Monitor your business performance and key metrics</p>
            </div>
            
            <p className="mb-16 text-white/60 text-lg leading-relaxed">
              Welcome to your invoice forecasting dashboard. Here you can monitor key business metrics,
              track recent invoice activity, and access powerful analytics tools to optimize your financial operations.
            </p>

            {/* Key Metrics */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">Key Metrics</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.name}
                    className="bg-white/10 p-6 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-300 w-full overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4 w-full">
                      <div className="flex items-center min-w-0 flex-1">
                        <stat.icon className="h-6 w-6 text-white mr-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white/70 mb-1 truncate" title={stat.name}>{stat.name}</p>
                          <p className="text-2xl font-bold text-white" title={stat.value}>{stat.value}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/20 w-full">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium text-white" title={stat.change}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-white/60 ml-1 truncate">from last month</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">Recent Invoices</h3>
              <div className="bg-white/10 rounded-lg border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/5 divide-y divide-white/20">
                      {recentInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-white/10 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-white">{invoice.id}</td>
                          <td className="px-6 py-4 text-sm text-white/70">{invoice.customer}</td>
                          <td className="px-6 py-4 text-sm text-white/70">{invoice.amount}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                              invoice.status === "paid"
                                ? "bg-white/20 text-white border-white/30"
                                : invoice.status === "pending"
                                ? "bg-white/10 text-white border-white/20"
                                : "bg-white/5 text-white/80 border-white/10"
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-white/70">{invoice.dueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-40 scroll-mt-16 md:mb-48 lg:mb-64 lg:scroll-mt-24" aria-label="Features">
          <div className="sticky top-0 z-20 -mx-6 mb-8 w-screen bg-black/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-100 lg:sr-only">Features</h2>
          </div>

          <div>
            <ul className="group/list">
              {features.map((feature, index) => (
                <li key={index} className={`mb-40 ${index === 1 ? 'ml-2' : index === 2 ? '-ml-1' : ''}`}>
                  <div className="group relative grid gap-6 pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-6 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
                    {/* Layered shadow system for depth */}
                    <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition-all duration-500 motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-gradient-to-br lg:group-hover:from-gray-800/30 lg:group-hover:to-gray-900/40 lg:group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] lg:group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:group-hover:drop-shadow-2xl"></div>
                    <div className="absolute -inset-x-3 -inset-y-3 z-0 hidden rounded-md transition-all duration-300 motion-reduce:transition-none lg:-inset-x-5 lg:block lg:group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] lg:group-hover:drop-shadow-lg"></div>
                    
                    <div className="z-10 sm:col-span-6">
                      <h3 className="font-medium leading-snug text-gray-100">
                        <div className="inline-flex items-baseline font-medium leading-tight text-white hover:text-white/90 focus-visible:text-white/90 group/link text-base transition-all duration-300">
                          <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block"></span>
                          <feature.icon className={`mr-3 h-5 w-5 inline text-white transition-all duration-300 group-hover:scale-110 ${index === 0 ? 'ml-1' : index === 1 ? '-ml-0.5' : 'ml-0.5'}`} />
                          <span className="text-lg font-semibold tracking-tight">{feature.title}</span>
                        </div>
                      </h3>
                      <p className={`mt-4 text-base leading-relaxed text-gray-400 transition-all duration-300 ${index === 0 ? 'mt-5' : index === 1 ? 'mt-3' : 'mt-4'}`}>
                        {feature.description}
                      </p>
                      <ul className={`flex flex-wrap gap-2 transition-all duration-300 ${index === 0 ? 'mt-5' : index === 1 ? 'mt-3' : 'mt-4'}`} aria-label="Technologies used">
                        {feature.technologies.map((tech, techIndex) => (
                          <li key={tech} className={`transition-all duration-300 hover:scale-105 ${techIndex === 0 ? 'ml-0' : techIndex === 1 ? 'ml-1' : 'ml-0.5'}`}>
                            <div className="flex items-center rounded-full bg-gradient-to-br from-gray-800/40 to-gray-900/60 px-3 py-1.5 text-sm font-medium leading-5 text-white border border-gray-600/30 shadow-lg hover:shadow-xl hover:border-gray-500/40 transition-all duration-300 backdrop-blur-sm">
                              {tech}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
