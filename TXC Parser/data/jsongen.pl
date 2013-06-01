#!/usr/bin/perl
use v5.010;
use JSON::PP;
use strict;

my $coder = JSON::PP->new->ascii->pretty->allow_nonref;
my %data;

if ($#ARGV > -1) {
	print "Usage: perl $0.\n\n",
	"Creates a file, scripts.json, containing a mapping of all\n",
	"JSON files produced by the perl TXC parser.\n";
	exit 1;
}

for (sort glob("*")) {
	if (/^\./) {
		next;
	}
	elsif (/^\d+$/ and -d) {
		my $dir = $_;
#		print "Dir: $_\n";
		chdir $_;
		for my $j (sort glob("*.json")) {
			if ($j eq $0) {
				next;
			}
			my %lines;
			my $operator;
			my @routes;
			open F, "<", $j;
			my $in_routes;
			my $in_lines;
			my @cur_route_seg;
			while (<F>) {
				chomp;
				if (/var OPERATOR/) {
					# operator
					$operator = (split/ = /)[1];
					$operator =~ s/"//g;
					$operator =~ s/;//g;
				}
				elsif (/var LINES/) {
					$in_lines = 1;
					next;
				}
				elsif (defined $in_lines) {
					if (/;|\}/) {
						$in_lines = undef;
						next;
					}

					my $d = (split/ : /)[1];
					$d =~ s/"//g;
					$d =~ s/,//g;
				

					$lines{$d} = "data/$dir/$j";
				}
				elsif (/var stations/) {
					last;
				}



			}

			close F;
#			print "$line => $_/$j\n";
			for my $z (keys %lines) {
				my $chrcode = 65;
				my $oz = $z;
				if (defined $data{$operator}{$z}) {
					my $j = $z . chr $chrcode;
					while (defined $data{$operator}{$j}) {
						$chrcode++;
						$j = $z . chr $chrcode;
					}
					$z = $j;
					print "Chose $z.\n";
				}
				$data{$operator}{$z} = $lines{$oz};
			}
				#push $data{$operator}, {%lines};
#			print $files{$line}, "\n";


		}
		chdir "..";
	}
}

open FILE, "> scripts.json";
print FILE "var SCRIPTS = ", $coder->encode(\%data);
close FILE;

print "File mapping written to scripts.json.\n";

__END__

				elsif (/var ROUTES/) {
					# in routes!
					$in_routes = 1;
					say "in routes";
					
				}
				elsif (defined $in_routes) {
					if (/^;/) {
						$in_routes = undef;
						say "end routes";
						next;
					}
					elsif (/name/) {
						my $r = (split/ : /)[1];
						$r =~ s/"//g;
						$r =~ s/,//g;
						say "name: $r";
						$cur_route_seg[0] = $r;
					}
					elsif (/line/) {
						my $r = (split/ : /)[1];
						$r =~ s/"//g;
						$r =~ s/,//g;
						if ($r eq "null") {
							next;
						}
						say "line $r";
						$cur_route_seg[1] = $r;
						
						if (!defined $lines{$r}) {
							$lines{$r} = \@{["$dir/$j"]};
						}
						push $lines{$r}, 
							$cur_route_seg[0];
						say "saved to lines: $lines{$r}";

						
					}
