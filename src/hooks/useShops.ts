import { useEffect, useState } from "react";
import { loadShops, type Shop } from "../lib/shops";

interface ShopsState {
    data: Shop[];
    error: string | null;
    loading: boolean;
}

export function useShops(): ShopsState {
    const [state, setState] = useState<ShopsState>({
        data: [],
        error: null,
        loading: true,
    });

    useEffect(() => {
        let cancelled = false;
        loadShops()
            .then((data) => {
                if (!cancelled) setState({ data, error: null, loading: false });
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setState({
                        data: [],
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        loading: false,
                    });
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}
