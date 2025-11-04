import { Form, required, useLogin, useNotify } from "ra-core";
import { Link } from "react-router";
import { CRMLoginPage } from "@santonastaso/shared";
import { TextInput } from "@/components/admin/text-input";
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
      TextInput={TextInput}
      required={required}
      Link={Link}
    />
  );
};
