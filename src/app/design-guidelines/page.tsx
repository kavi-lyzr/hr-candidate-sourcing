"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronDownIcon, 
  InfoIcon, 
  AlertTriangleIcon, 
  CheckIcon, 
  SettingsIcon,
  UserIcon,
  HomeIcon,
  PaletteIcon,
  TypeIcon,
  GridIcon,
  ComponentIcon
} from "lucide-react";

export default function DesignGuidelines() {
  const [selectedFramework, setSelectedFramework] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#603BFC] to-[#A94FA1] rounded-xl flex items-center justify-center">
              <PaletteIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Lyzr AI Design System</h1>
              <p className="text-xl text-muted-foreground mt-2">
                Premium component library for building exceptional SaaS applications
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="default">Next.js 15</Badge>
            <Badge variant="secondary">Tailwind CSS v4</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="outline">Radix UI</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="typography" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <TypeIcon className="w-4 h-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <PaletteIcon className="w-4 h-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <ComponentIcon className="w-4 h-4" />
              Components
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <GridIcon className="w-4 h-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <HomeIcon className="w-4 h-4" />
              Patterns
            </TabsTrigger>
          </TabsList>

          {/* Typography Section */}
          <TabsContent value="typography" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TypeIcon className="w-5 h-5" />
                  Typography Scale
                </CardTitle>
                <CardDescription>
                  Our typography system uses Switzer font family with carefully crafted scales for optimal readability and hierarchy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-foreground">Heading 1 - Main Page Title</h1>
                    <code className="text-sm text-muted-foreground">text-4xl font-bold</code>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold text-foreground">Heading 2 - Section Title</h2>
                    <code className="text-sm text-muted-foreground">text-3xl font-semibold</code>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-foreground">Heading 3 - Subsection</h3>
                    <code className="text-sm text-muted-foreground">text-2xl font-semibold</code>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xl font-medium text-foreground">Heading 4 - Component Title</h4>
                    <code className="text-sm text-muted-foreground">text-xl font-medium</code>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-base text-foreground">Body Text - This is the standard body text used throughout the application for content and descriptions.</p>
                    <code className="text-sm text-muted-foreground">text-base</code>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Small Text - Used for captions, labels, and secondary information.</p>
                    <code className="text-sm text-muted-foreground">text-sm text-muted-foreground</code>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Extra Small Text - For timestamps, metadata, and fine print.</p>
                    <code className="text-sm text-muted-foreground">text-xs text-muted-foreground</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors Section */}
          <TabsContent value="colors" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PaletteIcon className="w-5 h-5" />
                  Color Palette
                </CardTitle>
                <CardDescription>
                  Our color system provides semantic meaning and ensures accessibility across light and dark themes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Primary Colors */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Primary Colors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-primary rounded-lg"></div>
                      <p className="text-sm font-medium">Primary</p>
                      <code className="text-xs text-muted-foreground">bg-primary</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-primary-foreground border rounded-lg"></div>
                      <p className="text-sm font-medium">Primary Foreground</p>
                      <code className="text-xs text-muted-foreground">bg-primary-foreground</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-secondary rounded-lg"></div>
                      <p className="text-sm font-medium">Secondary</p>
                      <code className="text-xs text-muted-foreground">bg-secondary</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-accent rounded-lg"></div>
                      <p className="text-sm font-medium">Accent</p>
                      <code className="text-xs text-muted-foreground">bg-accent</code>
                    </div>
                  </div>
                </div>

                {/* Neutral Colors */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Neutral Colors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-background border rounded-lg"></div>
                      <p className="text-sm font-medium">Background</p>
                      <code className="text-xs text-muted-foreground">bg-background</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-card border rounded-lg"></div>
                      <p className="text-sm font-medium">Card</p>
                      <code className="text-xs text-muted-foreground">bg-card</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-muted rounded-lg"></div>
                      <p className="text-sm font-medium">Muted</p>
                      <code className="text-xs text-muted-foreground">bg-muted</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-border border-2 border-foreground rounded-lg"></div>
                      <p className="text-sm font-medium">Border</p>
                      <code className="text-xs text-muted-foreground">bg-border</code>
                    </div>
                  </div>
                </div>

                {/* Status Colors */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Status Colors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-destructive rounded-lg"></div>
                      <p className="text-sm font-medium">Destructive</p>
                      <code className="text-xs text-muted-foreground">bg-destructive</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-chart-2 rounded-lg"></div>
                      <p className="text-sm font-medium">Success</p>
                      <code className="text-xs text-muted-foreground">bg-chart-2</code>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-chart-4 rounded-lg"></div>
                      <p className="text-sm font-medium">Warning</p>
                      <code className="text-xs text-muted-foreground">bg-chart-4</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Section */}
          <TabsContent value="components" className="space-y-8">
            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  Primary actions and interactions throughout the application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="default">Primary Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <SettingsIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>
                  Status indicators and labels for categorization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>
                  Important notifications and system messages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <InfoIcon className="w-4 h-4" />
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>
                    This is an informational alert with useful details for the user.
                  </AlertDescription>
                </Alert>
                
                <Alert variant="destructive">
                  <AlertTriangleIcon className="w-4 h-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Something went wrong. Please check your input and try again.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Section */}
          <TabsContent value="layout" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GridIcon className="w-5 h-5" />
                  Layout System
                </CardTitle>
                <CardDescription>
                  Responsive grid and flexbox utilities for building layouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Grid System</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-center">Column 1</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">Column 2</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">Column 3</div>
                    </Card>
                  </div>
                  <code className="text-sm text-muted-foreground">
                    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
                  </code>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Flexbox Layout</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Card className="flex-1 p-4">
                      <div className="text-center">Flex Item 1</div>
                    </Card>
                    <Card className="flex-1 p-4">
                      <div className="text-center">Flex Item 2</div>
                    </Card>
                  </div>
                  <code className="text-sm text-muted-foreground">
                    flex flex-col sm:flex-row gap-4
                  </code>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Spacing Scale</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary"></div>
                      <span className="text-sm">gap-2 (0.5rem)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 bg-primary"></div>
                      <span className="text-sm">gap-4 (1rem)</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-6 h-6 bg-primary"></div>
                      <span className="text-sm">gap-6 (1.5rem)</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="w-8 h-8 bg-primary"></div>
                      <span className="text-sm">gap-8 (2rem)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forms Section */}
          <TabsContent value="forms" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckIcon className="w-5 h-5" />
                  Form Components
                </CardTitle>
                <CardDescription>
                  Input fields, selects, and form controls with proper validation states.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Text Input</label>
                      <Input placeholder="Enter your name" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Input</label>
                      <Input type="email" placeholder="Enter your email" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password Input</label>
                      <Input type="password" placeholder="Enter password" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Dropdown</label>
                      <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a framework" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="next">Next.js</SelectItem>
                          <SelectItem value="react">React</SelectItem>
                          <SelectItem value="vue">Vue.js</SelectItem>
                          <SelectItem value="svelte">Svelte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dropdown Menu</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            Open Menu
                            <ChevronDownIcon className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>My Account</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <UserIcon className="w-4 h-4 mr-2" />
                            Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <SettingsIcon className="w-4 h-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={isChecked}
                        onCheckedChange={(checked) => setIsChecked(checked === true)}
                      />
                      <label 
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Accept terms and conditions
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patterns Section */}
          <TabsContent value="patterns" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HomeIcon className="w-5 h-5" />
                  Common UI Patterns
                </CardTitle>
                <CardDescription>
                  Frequently used component combinations and layout patterns.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Dashboard Card Pattern */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dashboard Cards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">2,847</div>
                        <p className="text-xs text-muted-foreground">
                          +12% from last month
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <InfoIcon className="w-4 h-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">1,247</div>
                        <p className="text-xs text-muted-foreground">
                          +8% from last hour
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <CheckIcon className="w-4 h-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">23.4%</div>
                        <p className="text-xs text-muted-foreground">
                          +2.1% from last week
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Action Panel Pattern */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Action Panel</h3>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>User Management</CardTitle>
                          <CardDescription>
                            Manage user accounts and permissions
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Export
                          </Button>
                          <Button size="sm">
                            Add User
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Input placeholder="Search users..." className="w-64" />
                          <Select>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="guest">Guest</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Badge variant="secondary">247 users</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t bg-card mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              Built with ❤️ by Lyzr AI • Powered by Next.js, Tailwind CSS, and Radix UI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
