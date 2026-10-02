import { useEffect, useState } from "react";
import { loadTaiwanGeo, type TaiwanGeo } from "../lib/taiwanGeo";

interface TaiwanGeoState {
    data: TaiwanGeo | null;
    error: string | null;
    loading: boolean;
}

export function useTaiwanGeo(): TaiwanGeoState {
    const [state, setState] = useState<TaiwanGeoState>({
        data: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        let cancelled = false;
        loadTaiwanGeo()
            .then((data) => {
                if (!cancelled) setState({ data, error: null, loading: false });
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setState({
                        data: null,
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
