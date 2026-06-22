import { isKingdomCard } from "../StandardCardEligibilityFunctions";
import { PileSpecification } from "./PileSpecification";

const anyKingdomPileSpecification = new PileSpecification(isKingdomCard, true, true);

export { anyKingdomPileSpecification };