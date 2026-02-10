import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet } from "lucide-react";

interface WalletCardProps {
    balance: number;
    unit: string;
    cementType: string;
    onAddFunds: () => void;
}

export const WalletCard = ({ balance, unit, cementType, onAddFunds }: WalletCardProps) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="heading-card capitalize">
                    {cementType.replace("_", " ")} Wallet
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-responsive-xl font-bold">
                    {balance.toLocaleString()} {unit}
                </div>
                <p className="body-small text-muted-foreground mb-4">
                    Available to lift
                </p>
                <Button onClick={onAddFunds} size="sm" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add / Adjust Funds
                </Button>
            </CardContent>
        </Card>
    );
};
