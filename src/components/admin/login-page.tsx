import { Form, required, useLogin, useNotify } from "ra-core";
import { Link } from "react-router";
import { CRMLoginPage } from "@santonastaso/shared";
import { useConfigurationContext } from "@/atomic-crm/root/ConfigurationContext.tsx";

export const LoginPage = (props: { redirectTo?: string }) => {
  const { darkModeLogo, title } = useConfigurationContext();
  const { redirectTo } = props;

  return (
    <CRMLoginPage
      title={title}
      logo={darkModeLogo}
      redirectTo={redirectTo}
      useLogin={useLogin}
      useNotify={useNotify}
      Form={Form}
      required={required}
      Link={Link}
    />
  );
};
