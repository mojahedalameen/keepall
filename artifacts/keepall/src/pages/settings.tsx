import { 
  useGetProfile, 
  useUpdateProfile,
  getGetProfileQueryKey
} from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCircle, Mail, Calendar, Shield, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { useEffect } from "react";

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Settings() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: profile, isLoading: isProfileLoading } = useGetProfile();
  
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
    },
  });

  useEffect(() => {
    if (profile?.displayName) {
      form.reset({ displayName: profile.displayName });
    }
  }, [profile, form]);

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          toast({ title: "Profile updated successfully" });
        },
        onError: () => {
          toast({ title: "Failed to update profile", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account profile and preferences.</p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your public identity on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isProfileLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full max-w-md mt-6" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <UserCircle className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{profile?.displayName || user?.firstName || 'User'}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>

                <div className="max-w-md pt-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-display-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={updateProfile.isPending || !form.formState.isDirty}
                        data-testid="button-save-profile"
                      >
                        {updateProfile.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Information about your account status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isProfileLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full max-w-sm" />
                <Skeleton className="h-6 w-full max-w-sm" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24">Joined:</span>
                  <span className="font-medium">
                    {profile?.createdAt ? format(new Date(profile.createdAt), "MMMM d, yyyy") : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24">Status:</span>
                  <span className="font-medium flex items-center gap-2">
                    {profile?.isActive ? (
                      <><span className="w-2 h-2 rounded-full bg-green-500"></span> Active</>
                    ) : (
                      <><span className="w-2 h-2 rounded-full bg-red-500"></span> Inactive</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24">Role:</span>
                  <span className="font-medium capitalize">
                    {user?.publicMetadata?.role || 'User'}
                  </span>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button 
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground w-full sm:w-auto"
              onClick={() => signOut()}
              data-testid="button-sign-out"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
