import { getCurrentUser } from "@/lib/appwrite";
import { UserInterface } from "@/lib/types";
import { createContext, useContext, useEffect, useState } from "react";

interface GlobalContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserInterface | null; // Puedes definir una interfaz más específica si conoces la estructura del 'user'
  setUser: React.Dispatch<React.SetStateAction<any | null>>;
  isLoading: boolean;
}

const GlobalContext = createContext<GlobalContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  user: null,
  setUser: () => {},
  isLoading: true
})
export const useGlobalContext = (): GlobalContextType => useContext(GlobalContext)

export const GlobalProvider = ({ children } : { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<UserInterface | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res) {
          setIsLoggedIn(true)
          setUser(res)
        } else {
          setIsLoggedIn(false)
          setUser(null)
        }
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return (
    <GlobalContext.Provider value={{
      isLoggedIn,
      setIsLoggedIn,
      user,
      setUser,
      isLoading
    }}>
      {children}
    </GlobalContext.Provider>
  )
}