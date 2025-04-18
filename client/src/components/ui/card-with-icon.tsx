import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CardWithIconProps {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
  iconBgColor?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const CardWithIcon: React.FC<CardWithIconProps> = ({
  icon: Icon,
  title,
  iconColor = "text-primary-600",
  iconBgColor = "bg-primary-100",
  children,
  footer,
}) => {
  return (
    <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="ml-3 text-lg font-semibold text-neutral-800">{title}</h3>
        </div>
        <div>{children}</div>
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
};

export default CardWithIcon;
