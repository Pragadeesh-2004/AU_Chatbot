import { useStateMachine } from "little-state-machine";
import * as actions from "@/actions/rateLimitActions";

export const useRateLimitState = () => {
  const { state, actions: stateMachineActions } = useStateMachine({ actions });
  return { state, actions: stateMachineActions };
};
