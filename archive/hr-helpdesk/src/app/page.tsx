'use client';

// Commented out landing page components - we're skipping directly to auth/organizations
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { landingPageContent } from "@/lib/config";
// import { Github, Linkedin, Twitter, Bot, Route, Book, Building2, BarChart3, Plug, ArrowRight, Sparkles, Users, Clock, Shield } from "lucide-react";
// import { ThemeSwitcher } from "@/components/theme-switcher";
import { useAuth } from "@/lib/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// const iconMap = {
//   bot: Bot,
//   route: Route,
//   book: Book,
//   building: Building2,
//   chart: BarChart3,
//   plug: Plug,
// };


export default function HomePage() {

  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Skip landing page and redirect based on authentication status
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // If authenticated, go to organizations page
        router.push('/organizations');
      } else {
        // If not authenticated, trigger login
        login();
      }
    }
  }, [isAuthenticated, isLoading, router, login]);

  // Show loading state while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">
          {isLoading ? "Loading..." : "Redirecting to authentication..."}
        </p>
      </div>
    </div>
  );

  // Commented out all the landing page JSX - we're skipping directly to auth/organizations
  // return (
  //   <div className="flex flex-col min-h-screen">
  //     {/* Header */}
  //     <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
  //       <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
  //         <div className="flex items-center gap-2">
  //           <div className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
  //             Lyzr
  //           </div>
  //           <Badge variant="secondary" className="text-xs">HR</Badge>
  //         </div>
  //         <nav className="hidden md:flex gap-6 items-center">
  //           <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
  //           <a href="#demo" className="text-sm font-medium hover:text-primary transition-colors">Demo</a>
  //           <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
  //         </nav>
  //         <div className="flex items-center gap-3">
  //           <Button variant="ghost" size="sm" asChild>
  //             <a href="#demo">{landingPageContent.secondaryAction}</a>
  //           </Button>
  //           <Button size="sm" className="hidden sm:flex" onClick={handleLogin} disabled={isLoading}>
  //             {getButtonText()}
  //           </Button>
  //           <ThemeSwitcher />
  //         </div>
  //       </div>
  //     </header>

  //     <main className="flex-1">
  //       {/* Hero Section */}
  //       <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
  //         {/* Background gradient */}
  //         <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
  //         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
          
  //         <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
  //           <div className="max-w-4xl mx-auto space-y-8">
  //             {/* Badge */}
  //             <div className="flex justify-center animate-fade-in">
  //               <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
  //                 <Sparkles className="h-4 w-4 mr-2" />
  //                 AI-Powered HR Solutions
  //               </Badge>
  //             </div>

  //             {/* Main heading */}
  //             <div className="space-y-4 animate-fade-in-down">
  //               <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
  //                 {landingPageContent.title}
  //               </h1>
  //               <p className="text-lg sm:text-xl text-muted-foreground font-medium">
  //                 {landingPageContent.subtitle}
  //               </p>
  //             </div>

  //             {/* Description */}
  //             <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
  //               {landingPageContent.description}
  //             </p>

  //             {/* Stats */}
  //             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 animate-fade-in-up delay-200">
  //               <div className="text-center">
  //                 <div className="text-2xl sm:text-3xl font-bold">95%</div>
  //                 <div className="text-sm text-muted-foreground">Faster Resolution</div>
  //               </div>
  //               <div className="text-center">
  //                 <div className="text-2xl sm:text-3xl font-bold">24/7</div>
  //                 <div className="text-sm text-muted-foreground">AI Support</div>
  //               </div>
  //               <div className="text-center">
  //                 <div className="text-2xl sm:text-3xl font-bold">80%</div>
  //                 <div className="text-sm text-muted-foreground">Cost Reduction</div>
  //               </div>
  //               <div className="text-center">
  //                 <div className="text-2xl sm:text-3xl font-bold">500+</div>
  //                 <div className="text-sm text-muted-foreground">Companies</div>
  //               </div>
  //             </div>

  //             {/* CTA Buttons */}
  //             <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 animate-fade-in-up delay-300">
  //               <Button size="lg" className="text-lg px-8 py-6" onClick={handleLogin} disabled={isLoading}>
  //                 <span className="flex items-center gap-2">
  //                   {getButtonText()}
  //                   <ArrowRight className="h-5 w-5" />
  //                 </span>
  //               </Button>
  //               <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
  //                 <a href="#demo">{landingPageContent.secondaryAction}</a>
  //               </Button>
  //             </div>

  //             {/* Trust indicators */}
  //             <div className="flex justify-center items-center gap-6 pt-8 opacity-60 animate-fade-in-up delay-500">
  //               <div className="flex items-center gap-2 text-sm">
  //                 <Shield className="h-4 w-4" />
  //                 Enterprise Security
  //               </div>
  //               <div className="flex items-center gap-2 text-sm">
  //                 <Users className="h-4 w-4" />
  //                 Multi-tenant
  //               </div>
  //               <div className="flex items-center gap-2 text-sm">
  //                 <Clock className="h-4 w-4" />
  //                 Real-time
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </section>

  //       {/* Features Section */}
  //       <section id="features" className="py-20 md:py-32 bg-muted/40">
  //         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
  //           <div className="text-center mb-16">
  //             <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
  //             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
  //               Everything you need to transform your HR operations and employee experience
  //             </p>
  //           </div>
  //           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
  //             {landingPageContent.features.map((feature, index) => {
  //               const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
  //               return (
  //                 <Card key={index} className="group hover:shadow-lg transition-all duration-300 animate-fade-in-up border-0 bg-background/60 backdrop-blur">
  //                   <CardHeader>
  //                     <div className="flex items-center gap-3 mb-2">
  //                       <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
  //                         <IconComponent className="h-6 w-6 text-primary" />
  //                       </div>
  //                       <CardTitle className="text-xl">{feature.title}</CardTitle>
  //                     </div>
  //                   </CardHeader>
  //                   <CardContent>
  //                     <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
  //                   </CardContent>
  //                 </Card>
  //               );
  //             })}
  //           </div>
  //         </div>
  //       </section>

  //       {/* Demo Section */}
  //       <section id="demo" className="py-20 md:py-32">
  //         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
  //           <div className="text-center mb-16">
  //             <h2 className="text-3xl md:text-4xl font-bold mb-4">See it in Action</h2>
  //             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
  //               Experience the power of AI-driven HR support
  //             </p>
  //           </div>
  //           <div className="max-w-5xl mx-auto">
  //             <div className="aspect-video bg-gradient-to-br from-muted to-muted/60 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center group hover:border-primary/50 transition-colors">
  //               <div className="text-center space-y-4">
  //                 <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
  //                   <Bot className="h-8 w-8 text-primary" />
  //                 </div>
  //                 <p className="text-muted-foreground">Interactive demo coming soon</p>
  //                 <Button variant="outline" className="group-hover:border-primary group-hover:text-primary">
  //                   Request Early Access
  //                 </Button>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </section>

  //       {/* Testimonials Section */}
  //       <section id="testimonials" className="py-20 md:py-32 bg-muted/40">
  //         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
  //           <div className="text-center mb-16">
  //             <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
  //             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
  //               See how organizations are transforming their HR operations
  //             </p>
  //           </div>
  //           <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
  //             {landingPageContent.testimonials.map((testimonial, index) => (
  //               <Card key={index} className="border-0 bg-background/60 backdrop-blur">
  //                 <CardContent className="pt-6">
  //                   <div className="mb-4">
  //                     <div className="flex text-primary mb-2">
  //                       {[...Array(5)].map((_, i) => (
  //                         <span key={i} className="text-lg">★</span>
  //                       ))}
  //                     </div>
  //                     <p className="text-lg leading-relaxed italic">"{testimonial.quote}"</p>
  //                   </div>
  //                   <div className="text-sm">
  //                     <p className="font-semibold">{testimonial.author}</p>
  //                     <p className="text-muted-foreground">{testimonial.role}</p>
  //                   </div>
  //                 </CardContent>
  //               </Card>
  //             ))}
  //           </div>
  //         </div>
  //       </section>

  //       {/* CTA Section */}
  //       <section className="py-20 md:py-32 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
  //         <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
  //           <div className="max-w-3xl mx-auto space-y-8">
  //             <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your HR?</h2>
  //             <p className="text-lg text-muted-foreground">
  //               Join hundreds of organizations already using Lyzr HR Helpdesk to streamline their employee support
  //             </p>
  //             <div className="flex flex-col sm:flex-row justify-center gap-4">
  //               <Button size="lg" className="text-lg px-8 py-6" onClick={handleLogin} disabled={isLoading}>
  //                 <span className="flex items-center gap-2">
  //                   {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
  //                   <ArrowRight className="h-5 w-5" />
  //                 </span>
  //               </Button>
  //               <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
  //                 <a href="#" className="flex items-center gap-2">
  //                   <Github className="h-5 w-5" />
  //                   {landingPageContent.blueprintAction}
  //                 </a>
  //               </Button>
  //             </div>
  //           </div>
  //         </div>
  //       </section>
  //     </main>

  //     {/* Footer */}
  //     <footer className="py-8 bg-muted/40 border-t">
  //       <div className="container mx-auto px-4 sm:px-6 lg:px-8">
  //         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
  //           <div className="flex items-center gap-2">
  //             <div className="font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
  //               Lyzr
  //             </div>
  //             <Badge variant="secondary" className="text-xs">HR</Badge>
  //           </div>
  //           <p className="text-sm text-muted-foreground">
  //             &copy; {new Date().getFullYear()} Lyzr. All rights reserved.
  //           </p>
  //           <div className="flex gap-4">
  //             <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
  //               <Twitter className="h-5 w-5" />
  //             </a>
  //             <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
  //               <Linkedin className="h-5 w-5" />
  //             </a>
  //             <a href="https://github.com/lyzr-ai/hr-helpdesk" className="text-muted-foreground hover:text-primary transition-colors">
  //               <Github className="h-5 w-5" />
  //             </a>
  //           </div>
  //         </div>
  //       </div>
  //     </footer>
  //   </div>
  // );
}
