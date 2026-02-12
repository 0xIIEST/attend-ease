
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GraduationCap, LogIn, Calendar, CheckCircle, BarChart3, ArrowRight, ArrowLeft, Eye, EyeOff, ShieldAlert, UserPlus, Info } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, profile, loading, login, register } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Form State
  const [collegeId, setCollegeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState("2026");
  const [dept, setDept] = useState("CSB");
  const [roll, setRoll] = useState("");
  const [group, setGroup] = useState<"A" | "B">("B");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <GraduationCap className="h-12 w-12 text-primary mb-4" />
          <div className="h-4 w-32 bg-primary/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (user && profile) {
    return <Dashboard />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId || !password) return;
    setIsSubmitting(true);
    try {
      await login(collegeId, password);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid College ID or password. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !dept || !roll) return;
    const generatedId = `${year}${dept.toUpperCase()}${roll.padStart(3, '0')}`;
    setCollegeId(generatedId);
    setStep(2);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords mismatch",
        description: "Please ensure both passwords match.",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        collegeId,
        name,
        year,
        branch: dept.toUpperCase(),
        rollNumber: roll,
        group: group
      }, password);
      
      setRegistrationSuccess(true);
      setMode("login");
      setStep(1);
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      let message = "An unexpected error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        message = "This College ID is already registered.";
      }
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl"></div>
      
      <div className="z-10 text-center mb-8 max-w-2xl">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20">
            < GraduationCap className="h-12 w-12 text-white" />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-3">
          <Info className="h-3 w-3" /> Unofficial IIEST Shibpur Portal
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-2 text-primary">
          AttendEase
        </h1>
        <p className="text-muted-foreground">Built by students, for the IIEST Shibpur community. Tracking the 2026 academic session.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 max-w-5xl w-full z-10">
        <div className="hidden md:flex flex-col justify-center space-y-6">
          <div className="flex gap-4 items-start">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-border">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">IIEST Schedule Sync</h3>
              <p className="text-muted-foreground text-sm">Your branch timetable is pre-loaded for the 2026 semester.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-border">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Smart Presence</h3>
              <p className="text-muted-foreground text-sm">Past classes are marked absent automatically to help you stay above the 75% threshold.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-border">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Academic Compliance</h3>
              <p className="text-muted-foreground text-sm">Stay eligible for exams with subject-wise breakdowns.</p>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-none ring-1 ring-black/5">
          <CardHeader className="text-center pb-2">
            {registrationSuccess && (
              <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm mb-4 font-medium border border-green-200">
                Account created successfully! Please log in.
              </div>
            )}
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              {mode === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {mode === "login" ? "Student Login" : "Batch Registration"}
            </CardTitle>
            <CardDescription>
              {mode === "login" 
                ? "Enter your credentials to access the hub" 
                : step === 1 ? "Identify your batch and group" : "Complete your student profile"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4">
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="collegeId">IIEST College ID</Label>
                  <Input 
                    id="collegeId" 
                    placeholder="e.g., 2026CSB001" 
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value.toUpperCase())}
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="off"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                  {isSubmitting ? "Authenticating..." : "Sign In to Portal"} <LogIn className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              step === 1 ? (
                <form onSubmit={handleRegisterNext} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Admission Year</Label>
                      <Input id="year" placeholder="2026" value={year} onChange={(e) => setYear(e.target.value)} maxLength={4} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dept">Branch Code</Label>
                      <Input id="dept" placeholder="CSB" value={dept} onChange={(e) => setDept(e.target.value.toUpperCase())} maxLength={3} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roll">Roll Number</Label>
                    <Input id="roll" placeholder="001" value={roll} onChange={(e) => setRoll(e.target.value)} maxLength={3} required />
                  </div>
                  <div className="space-y-3 pt-2">
                    <Label>Section Group</Label>
                    <RadioGroup value={group} onValueChange={(v) => setGroup(v as "A" | "B")} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="A" id="groupA" />
                        <Label htmlFor="groupA" className="font-normal">Group A</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="B" id="groupB" />
                        <Label htmlFor="groupB" className="font-normal">Group B</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button type="submit" className="w-full h-11 mt-2">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-xs font-mono mb-4 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span>Generated ID: <strong>{collegeId}</strong></span>
                      <span>Section: <strong>Group {group}</strong></span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="h-6 px-2 text-[10px]" disabled={isSubmitting}>Change</Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Portal Password</Label>
                    <Input id="regPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="off" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="off" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isSubmitting}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="submit" className="flex-[2] h-11" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Account"}
                    </Button>
                  </div>
                </form>
              )
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col border-t pt-6 bg-muted/20">
            <p className="text-sm text-muted-foreground mb-4">
              {mode === "login" ? "New to the portal?" : "Already have an account?"}
              <Button 
                variant="link" 
                className="px-2 font-bold text-primary" 
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setStep(1);
                  setRegistrationSuccess(false);
                }}
                disabled={isSubmitting}
              >
                {mode === "login" ? "Register Now" : "Sign In"}
              </Button>
            </p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              <ShieldAlert className="h-3 w-3" />
              Unofficial IIEST Shibpur Community Hub
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
