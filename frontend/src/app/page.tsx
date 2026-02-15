
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GraduationCap, ArrowRight, ShieldAlert, Info, Chrome } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, profile, loading, loginWithGoogle, completeRegistration, logout } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Profile Completion State
  const [collegeId, setCollegeId] = useState("");
  const [year, setYear] = useState("2026");
  const [dept, setDept] = useState("CSB");
  const [roll, setRoll] = useState("");
  const [group, setGroup] = useState<"A" | "B">("B");
  const [name, setName] = useState("");

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

  // 1. Authenticated AND has Profile -> Show Dashboard
  if (user && profile) {
    return <Dashboard />;
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Google Sign-In failed. Please try again.",
      });
    }
  };

  const handleSmartIdGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !dept || !roll) return;
    const generatedId = `${year}${dept.toUpperCase()}${roll.padStart(3, '0')}`;
    setCollegeId(generatedId);
    // Use Google name if available, otherwise empty string for manual entry
    setName(user?.displayName || "");
    setStep(2);
  };

  const handleProfileCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await completeRegistration({
        collegeId,
        name: name || user?.displayName || "Student",
        year,
        branch: dept.toUpperCase(),
        rollNumber: roll,
        group: group
      });
      toast({
        title: "Welcome to AttendEase!",
        description: "Your profile has been created successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Profile Creation Failed",
        description: "Could not save your details. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Authenticated but NO Profile -> Show Completion Form
  if (user && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl"></div>

        <Card className="shadow-2xl border-none ring-1 ring-black/5 max-w-md w-full z-10">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>We need a few academic details to set up your schedule.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {step === 1 ? (
              <form onSubmit={handleSmartIdGeneration} className="space-y-4">
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
              <form onSubmit={handleProfileCompletion} className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg text-xs font-mono mb-4 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span>Generated ID: <strong>{collegeId}</strong></span>
                    <span>Section: <strong>Group {group}</strong></span>
                  </div>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setStep(1)} className="h-6 px-2 text-[10px]" disabled={isSubmitting}>Change</Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                  {isSubmitting ? "Saving Profile..." : "Finish Setup"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="link" onClick={() => logout()} className="text-xs text-muted-foreground">
              Cancel & Authorization
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 3. No User -> Show Login
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl"></div>

      <div className="z-10 text-center mb-8 max-w-2xl">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20">
            <GraduationCap className="h-12 w-12 text-white" />
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

      <div className="w-full max-w-md z-10">
        <Card className="shadow-2xl border-none ring-1 ring-black/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to manage your attendance and schedule
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 flex flex-col gap-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 text-base font-medium flex items-center justify-center gap-3 bg-white text-black border hover:bg-gray-50 text-foreground"
              variant="outline"
            >
              <Chrome className="h-5 w-5 text-red-500" /> {/* Using Chrome icon as proxy for Google, or could use an SVG */}
              Sign in with Google
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col border-t pt-6 bg-muted/20">
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
