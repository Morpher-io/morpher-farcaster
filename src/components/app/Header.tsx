import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  return (
    <header className="flex items-center justify-between  px-4 py-3 items-center ">
      <div>
          <img
            src={`/src/assets/logos/morpher-header.svg`}
            alt={`Morpher Logo`}
            className=""
        />
      </div>
      <div className="cursor-pointer">
       <img
            src={`/src/assets/icons/info.svg`}
            alt={`info icon`}
            className=""
        />
        </div>
      {/* <nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild className="">
            <div>
            
              <img
                src={`/src/assets/icons/menu.svg`}
                alt={`Hamburger Menu`}
                 />
              <span className="sr-only">Open menu</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-sm" align="end">
            <DropdownMenuItem asChild>
              <Link to="/">Trade</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/portfolio">Portfolio</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/history">Trade History</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/leaderboard">Leaderboard</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav> */}
    </header>
  );
}
