

export function Header({ onHelpClick }: { onHelpClick: () => void }) {
  return (
    <header className="flex items-center justify-between  px-4 py-3 border-b ">
      <div>
          <img
            src={`/assets/logos/morpher-header.svg`}
            alt={`Morpher Logo`}
            className="w-36"
        />
      </div>
      <div className="cursor-pointer" onClick={onHelpClick}>
       <img
            src={`/assets/icons/help.svg`}
            alt={`help icon`}
            className="w-6"
        />
        </div>
      {/* <nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild className="">
            <div>
            
              <img
                src={`/assets/icons/menu.svg`}
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
