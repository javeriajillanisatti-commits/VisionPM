import React from 'react';
import Navbar from "../../components/navbar/Navbar";
import Main from "../../components/landing/Main";
import Features from "../../components/landing/Features";
import WorkFlow from "../../components/landing/WorkFlow";
import Footer from "../../components/landing/Footer";
import ContactPage from "../../components/landing/ContactPage";
import Step1 from "../../components/assets/Step1.png";
import Step2 from "../../components/assets/Step2.png";
import Step3 from "../../components/assets/Step3.png";
import Step4 from "../../components/assets/Step4.png";
import Step5 from "../../components/assets/Step5.png";
import Step6 from "../../components/assets/step6.png";
import Step7 from "../../components/assets/Step7.png";
import {
  ShieldCheck, FolderOpen, CheckSquare, MessageSquare,
  LayoutDashboard, TrendingDown, Sparkles, Settings2,
} from 'lucide-react';

const featuresData = [
  {
    title: "User Authentication",
    desc: "Secure login and role-based access control to protect every user account.",
    icon: ShieldCheck,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    hoverBorder: "hover:border-sky-400"
  },
  {
    title: "Workspace &\nProjects",
    desc: "Create workspaces and organize your team projects efficiently.",
    icon: FolderOpen,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    hoverBorder: "hover:border-blue-400"
  },
  {
    title: "Task\nManagement",
    desc: "Create, assign, and track daily tasks smoothly from To-Do to completion.",
    icon: CheckSquare,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    hoverBorder: "hover:border-purple-400"
  },
  {
    title: "Team\nCollaboration",
    desc: "Comment on tasks, share files, and stay updated with live activity alerts.",
    icon: MessageSquare,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-400"
  },
  {
    title: "Delay\nPrediction",
    desc: "AI reviews ongoing workloads and deadlines to forecast potential project delays.",
    icon: TrendingDown,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    hoverBorder: "hover:border-red-400"
  },
  {
    title: "Smart Resource\nAllocation",
    desc: "Get intelligent task suggestions based on individual team skills and capacity.",
    icon: Sparkles,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
    hoverBorder: "hover:border-cyan-400"
  },
  {
    title: "Dashboard &\nReports",
    desc: "Monitor overall team performance closely with clear visual charts and reports.",
    icon: LayoutDashboard,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    hoverBorder: "hover:border-amber-400"
  },
  {
    title: "Admin Control\nPanel",
    desc: "Manage user accounts and monitor active workspaces to control platform metrics.",
    icon: Settings2,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
    hoverBorder: "hover:border-slate-400"
  },
];

const workflowData = [
  {
    title: "Create Your Account",
    desc: "Sign up and get access to your personalized workspace.",
    image: Step1,
    color: "bg-blue-600"
  },
  {
    title: "Create a Workspace",
    desc: "Set up a workspace and invite project managers and team members.",
    image: Step2,
    color: "bg-purple-600"
  },
  {
    title: "Create Projects",
    desc: "Add projects with goals, deadlines, and project details.",
    image: Step3,
    color: "bg-emerald-600"
  },
  {
    title: "Assign Tasks",
    desc: "Create tasks, divide them into subtasks, and assign them to team members.",
    image: Step4,
    color: "bg-rose-600"
  },
  {
    title: "Collaborate and Track Progress",
    desc: "Share comments, upload files, and monitor task progress in real time.",
    image: Step5,
    color: "bg-indigo-600"
  },
  {
    title: "Get AI Insights",
    desc: "Get Smart Guidance to predict potential issues and make better project decisions.",
    image: Step6,
    color: "bg-cyan-600"
  },
  {
    title: "Analyze Results",
    desc: "View dashboards and reports to track project success and team productivity.",
    image: Step7,
    color: "bg-amber-600"
  }
];

const LandingPage = () => {
  return (
    <div
      className=" min-h-screen bg-white font-sans text-slate-900  scroll-smooth transition-colors duration-200">
      <Navbar landing />
      <main>
        <div id="home">
          <Main />
        </div>
        <div
          id="features" className="py-12 md:py-16 bg-blue-100 px-6 md:px-12 lg:px-20 border-y border-transparent"
        > <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <h2 className=" text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Powerful Features for Better{" "}
                <span className="text-blue-700 underline decoration-blue-200 underline-offset-8">Project Management</span></h2>
              <p className="text-gray-500 text-lg mt-4" >Everything you need to plan, manage, and deliver projects successfully. </p>
            </div>
            <div className=" grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full items-stretch ">
              {featuresData.map((feature, idx) => (
                <div key={idx} className=" w-full flex h-full">
                  <div className="w-full h-full flex flex-col [&>div]:h-full [&>div]:w-full [&>div]:flex [&>div]:flex-col [&>div]:justify-start [&>div>h3]:text-center [&>div>p]:text-center"> <Features {...feature} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <section
          id="workflow"

          className="pt-6 pb-12 md:pt-8 md:pb-16 px-4 sm:px-6 md:px-20 lg:px-32 bg-slate-50"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-2 md:mb-3">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 max-w-2xl leading-tight">               How VisionPM Works?
                <br />
                <span className=" text-blue-700">Simple Steps </span>{" "} to Success </h2>
              <p className="text-gray-500 text-lg max-w-xl ">A streamlined workflow designed to help you manage and track projects easily.</p>
              <div className="mt-2 flex gap-2">
                <div className=" w-12 h-1.5 bg-blue-700 rounded-full"></div>
                <div className=" w-4 h-1.5 bg-blue-400 rounded-full"></div>
                <div className=" w-2 h-1.5 bg-blue-200 rounded-full" ></div>
              </div>
            </div>

            <section

            className="pt-0 pb-2 md:pb-4 px-2 sm:px-4 md:px-8 lg:px-16"
            >
              <div className="max-w-7xl mx-auto">
                {workflowData.map((item, index) => (
                  <WorkFlow key={index} step={index + 1} {...item} />
                ))}
              </div>
            </section>
            <ContactPage />
          </div>
        </section>
      </main>
      <Footer />

    </div>
  );
};

export default LandingPage;