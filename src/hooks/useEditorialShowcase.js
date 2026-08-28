import { useEffect, useState } from "react";
import { getEditorialShowcase } from "../services/editorialShowcaseService";

export function useEditorialShowcase() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function loadShowcase() {
        try {
            setIsLoading(true);
            setError(null);

            const result = await getEditorialShowcase();

            if (isMounted) {
            setData(result);
            }
        } catch (err) {
            if (isMounted) {
            setError(err);
            }
        } finally {
            if (isMounted) {
            setIsLoading(false);
            }
        }
        }

        loadShowcase();

        return () => {
        isMounted = false;
        };
    }, []);

    return {
        data,
        isLoading,
        error,
    };
}