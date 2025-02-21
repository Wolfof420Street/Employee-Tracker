"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from 'lucide-react'


export default function LoginPage() {
  const [accessKey, setAccessKey] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
  
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey }),
      });
  
      const responseData = await response.json();
  
      if (response.ok) {
        const { token } = responseData;
        await signIn('credentials', { token, callbackUrl: '/' });
      } else {
        setError(responseData.error || 'Login failed');
      }
    } catch (error) {
      if(error instanceof Error) {
        console.error('Login error:', error.message, error.stack);
      }
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your access key to sign in</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="accessKey">Access Key</Label>
                <Input
                  id="accessKey"
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter your access key"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
          <Button className="w-full mt-4" type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

