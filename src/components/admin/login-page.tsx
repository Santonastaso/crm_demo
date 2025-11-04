import { useState } from "react";
import { Form, required, useLogin, useNotify } from "ra-core";
import type { SubmitHandler, FieldValues } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/admin/text-input";
import { Notification } from "@/components/admin/notification";
import { useConfigurationContext } from "@/atomic-crm/root/ConfigurationContext.tsx";

export const LoginPage = (props: { redirectTo?: string }) => {
  const { darkModeLogo, title } = useConfigurationContext();
  const { redirectTo } = props;
  const [loading, setLoading] = useState(false);
  const login = useLogin();
  const notify = useNotify();

  const handleSubmit: SubmitHandler<FieldValues> = (values) => {
    setLoading(true);
    login(values, redirectTo)
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        notify(
          typeof error === "string"
            ? error
            : typeof error === "undefined" || !error.message
              ? "ra.auth.sign_in_error"
              : error.message,
          {
            type: "error",
            messageArgs: {
              _:
                typeof error === "string"
                  ? error
                  : error && error.message
                    ? error.message
                    : undefined,
            },
          },
        );
      });
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Brand/Logo Section */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col p-10 text-white" style={{ backgroundColor: '#18181b' }}>
        <div className="relative z-20 flex items-center text-lg font-medium">
          {darkModeLogo && <img className="h-6 mr-2" src={darkModeLogo} alt={title} />}
          {title}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Logo/Title */}
           <div className="flex flex-col space-y-2 text-center lg:hidden">
             {darkModeLogo && <img className="h-8 mx-auto" src={darkModeLogo} alt={title} />}
             <h1 className="text-xl font-semibold">{title}</h1>
           </div>

          {/* Sign in header */}
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          </div>

          {/* Login Form */}
          <Form className="space-y-8" onSubmit={handleSubmit}>
            <TextInput
              label="Email"
              source="email"
              type="email"
              validate={required()}
            />
            <TextInput
              label="Password"
              source="password"
              type="password"
              validate={required()}
            />
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={loading}
            >
              Sign in
            </Button>
          </Form>

          {/* Forgot Password Link */}
          <Link
            to={"/forgot-password"}
            className="block text-sm text-center hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
      
      <Notification />
    </div>
  );
};
