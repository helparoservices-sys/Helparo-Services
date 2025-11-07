-- RPC to accept an application and assign a helper

CREATE OR REPLACE FUNCTION public.accept_application(p_request_id uuid, p_application_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_helper_id uuid;
BEGIN
  -- Ensure caller owns the request
  SELECT r.customer_id INTO v_customer_id FROM public.service_requests r WHERE r.id = p_request_id;
  IF v_customer_id IS NULL OR v_customer_id <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Find application and helper
  SELECT a.helper_id INTO v_helper_id FROM public.request_applications a WHERE a.id = p_application_id AND a.request_id = p_request_id;
  IF v_helper_id IS NULL THEN
    RAISE EXCEPTION 'application not found';
  END IF;

  -- Assign helper
  UPDATE public.service_requests
  SET assigned_helper_id = v_helper_id,
      assigned_at = timezone('utc'::text, now()),
      status = 'assigned'
  WHERE id = p_request_id;

  -- Mark chosen application accepted, others rejected
  UPDATE public.request_applications SET status = 'accepted' WHERE id = p_application_id;
  UPDATE public.request_applications SET status = 'rejected' WHERE request_id = p_request_id AND id <> p_application_id AND status = 'applied';

  PERFORM public.recalc_application_count(p_request_id);
END;
$$;
