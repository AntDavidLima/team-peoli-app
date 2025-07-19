import { useEffect, useState } from "react";
import { 
        Image, 
        KeyboardAvoidingView,
        Text, 
        Linking, 
        TouchableOpacity, 
        View } from "react-native";
import { api } from "@/lib/api";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import UnlockIcon from '@/assets/icons/unlock.svg';
import WhatsappIcon from '@/assets/icons/whatsapp.svg';
import { Redirect } from "expo-router";

export default function Disabled() {

    const { currentUser, logout, isAuthenticated } = useAuthentication();

    if (!isAuthenticated) {
		return <Redirect href="/login" />;
	}

    if (currentUser?.isActive) {
        return <Redirect href="/" />;
    }

    const [professorPhone, setProfessorPhone] = useState<string | null>(null);
    

    useEffect(() => {
        async function fetchProfessorPhone() {
        try {
            const { data } = await api.get(`/user/${currentUser?.id}/professor`);
            if (data) {
            setProfessorPhone(data.phone);
            }
        } catch (error) {
            setProfessorPhone(null);
        }
        }
        fetchProfessorPhone();
    }, []);
    
    return (	
        <KeyboardAvoidingView
        behavior="padding">
            <View className="w-full px-8 mt-4 justify-center h-full">
                <Image
                    style={{width: 150, height: 50, marginTop: 40}}
                    className="mb-12 self-center"
                    source={require("@/assets/images/logo.png")} />
                <UnlockIcon width={70} height={70} className="self-center mb-4 mt-12" />
                <View className="space-y-1 mb-3">
                    <Text style={{fontFamily: 'Inter-Bold'}} className="text-white text-xl text-center font-bold">Plano Inativo</Text>
                    <Text style={{fontFamily: 'Inter-Regular', alignSelf: 'center'}} className="mt-1 text-secondary text-sm text-center">
                        Você não possui um plano ativo no momento. Entre em contato para retornar.
                    </Text>
                </View>
                <TouchableOpacity
                    style={{marginTop: 40}}
                    className="flex-row gap-2 bg-main rounded h-12 items-center justify-center w-full px-10"
                    onPress={() => {
                        Linking.openURL(`https://wa.me/55${professorPhone}`);
                    }}
                > 
                    <WhatsappIcon width={20} height={20} />
                    <Text className="text-white font-semibold text-sm">Falar com o Treinador</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{marginTop: 20}}
                    className="flex-row gap-2 bg-lightBackground rounded h-12 items-center justify-center w-full px-10"
                    onPress={logout}
                > 
                    <Text className="text-white font-semibold text-sm">Voltar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}